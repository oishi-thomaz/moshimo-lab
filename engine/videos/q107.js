import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #107 おっさんずラブ（ドラマ・日本・2018年 テレビ朝日 土曜ナイトドラマ・全7話。U-NEXT・Netflix で見放題、
//   U-NEXT の作品ページ video.unext.jp/title/SID0034399（見放題の札）と Netflix の作品ページ netflix.com/jp/title/81011018、
//   Filmarks の動画配信欄（Hulu・Lemino・Netflix・Prime Video・U-NEXT 見放題）で2026/11/18確認。Filmarks 4.1・レビュー35,210件 filmarks.com/dramas/1062/2238）
// 確かめた事実（Filmarks の作品紹介、Wikipedia 日本語版 おっさんずラブ の あらすじ（シーズン1）・登場人物・反響。2026/11/18）：
//   ・女好きだけどモテない33歳のおっさん（春田創一・田中圭）が、ピュアすぎる乙女心を隠し持つおっさん上司と、同居しているイケメンでドSな後輩から告白される純愛ドラマ（Filmarks）
//   ・春田はひょんなことから、上司の黒澤武蔵（55歳・営業部長）が自分の隠し撮り写真をスマホの待ち受けにしていることを知る（Wikipedia あらすじ・登場人物）
//   ・春田は不動産会社の営業部員。実家暮らしで家事は母親任せだったので家事全般が苦手。合コンに参加することもあるがモテない（Wikipedia）
//   ・本社から異動してきた後輩の牧凌太は、春田の提案で春田の実家でルームシェア。家事全般に長け、料理が得意（Wikipedia）
//   ・2018年4月21日〜6月2日、テレビ朝日の土曜ナイトドラマで放送。2018年の新語・流行語大賞でトップテン（Wikipedia）
// 構成（ヒント6段）：1 上司のスマホの待ち受けが、なぜか自分の隠し撮り → 2 主人公は33歳の会社員・女好きなのにモテない
//   → 3 散らかった実家に職場の後輩が同居・家事は完璧な後輩 → 4 突然の告白・しかもひとりからじゃない
//   → 5 2018年の日本のドラマ・主演は田中圭・その年の流行語にも → 6 決め手：告白してきたのは乙女心をもつ55歳の部長と、同居中の後輩
// 誰と結ばれるか・結婚式の場面・結末は言わない。人物名・会社名・タイトルの文字は出さない。俳優の顔・ポスター・ロゴ・劇中の有名な場面の構図は使わない。人は汎用の3D
const S = quizStage({ bg: '#7a8aa0', floor: '#d8dee6', fogNear: 26, fogFar: 90 });
const qs = S.scene;
const R = rng(10710);

const HERO = { skin: '#f1c9a5', hair: '#3a2a20', shirt: '#ffffff', pants: '#3a4258', tie: true };
const HERO_HOME = { skin: '#f1c9a5', hair: '#3a2a20', shirt: '#8ab0d8', pants: '#5a6a7a' };
const BOSS = { skin: '#e8b98f', hair: '#8a8a8a', shirt: '#4a4e5a', pants: '#3a3e48', tie: true, scale: 1.05 };
const JUNIOR = { skin: '#f4d3b5', hair: '#1a1410', shirt: '#e8e4dc', pants: '#2a2e3a' };
const SIL = { skin: '#2a2e3a', hair: '#1a1c24', shirt: '#2a2e3a', pants: '#1a1c24' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
// ハート（押し出しの形）
const HEART = (() => { const s = new THREE.Shape(); s.moveTo(0, -0.5); s.bezierCurveTo(-0.1, -0.35, -0.55, -0.1, -0.5, 0.18); s.bezierCurveTo(-0.45, 0.45, -0.1, 0.5, 0, 0.25);
  s.bezierCurveTo(0.1, 0.5, 0.45, 0.45, 0.5, 0.18); s.bezierCurveTo(0.55, -0.1, 0.1, -0.35, 0, -0.5); return new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false }); })();
const HEARTS = [];
function heart(c = '#e8506a', s = 1) { const m = new THREE.Mesh(HEART, gl(c)); m.scale.setScalar(s); m.visible = false; qs.add(m); HEARTS.push(m); return m; }
// 自分の写真が待ち受けのスマホ（画面は人の形のシルエット＝隠し撮り）
function phone() { const g = new THREE.Group(); const b = box(0.62, 1.2, 0.06, mat('#1a1c22')); g.add(b);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 1.08), new THREE.MeshBasicMaterial({ map: canvasTex(270, 540, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#bcd8f0'); gr.addColorStop(1, '#f0e8d8'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = '#3a2a20'; c.fillRect(85, 150, 100, 40); c.fillStyle = '#f1c9a5'; c.fillRect(90, 180, 90, 90); c.fillStyle = '#ffffff'; c.fillRect(60, 280, 150, 200);
    c.fillStyle = '#b23a3a'; c.fillRect(128, 290, 14, 110); c.fillStyle = '#121212'; c.fillRect(110, 215, 12, 16); c.fillRect(148, 215, 12, 16);
    c.strokeStyle = '#e8506a'; c.lineWidth = 10; c.strokeRect(14, 14, w - 28, h - 28);
    c.fillStyle = '#e8506a'; for (const [x, y] of [[50, 90], [220, 120], [40, 470], [225, 440]]) { c.beginPath(); c.arc(x - 9, y, 11, 0, 7); c.arc(x + 9, y, 11, 0, 7); c.fill(); c.beginPath(); c.moveTo(x - 20, y + 4); c.lineTo(x, y + 26); c.lineTo(x + 20, y + 4); c.fill(); } }) }));
  sc.position.z = 0.035; g.add(sc); qs.add(g); return g; }

// ---------- 1段目. オフィス（x=0）。上司の机。スマホの画面が大きく浮かぶ ----------
{ const fl = box(14, 0.04, 12, mat('#c8ccd4')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(14, 4.2, 0.2, mat('#eef0f2')); wl.position.set(0, 2.1, -6); qs.add(wl);
  for (let i = 0; i < 3; i++) { const w = box(2.2, 1.6, 0.06, gl('#b8d8f0')); w.position.set(-4 + i * 4, 2.6, -5.88); qs.add(w); }
  const d = box(2.2, 0.06, 1.0, mat('#8a6a4a')); d.position.set(-0.6, 0.76, -3.6); qs.add(d);
  const dl = box(2.1, 0.72, 0.06, mat('#6a4a3a')); dl.position.set(-0.6, 0.38, -4.05); qs.add(dl);
  const ch = box(0.7, 1.4, 0.2, mat('#2a2e38')); ch.position.set(-0.6, 0.9, -4.6); qs.add(ch);
  for (let i = 0; i < 3; i++) { const dd = box(1.6, 0.06, 0.8, mat('#e8e8e8')); dd.position.set(2.6 + (i % 2) * 0.1, 0.74, -1.6 - i * 1.6); qs.add(dd); } }
const boss1 = makePerson(BOSS); boss1.position.set(-0.6, 0, -4.1); qs.add(boss1);
const hero1 = makePerson(HERO); hero1.position.set(0.9, 0, -2.6); qs.add(hero1);
const PH1 = phone();
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.5 }); qs.add(Q1);
const tPeek = tag('上司のスマホの、待ち受けが…', { size: 50, w: 800, bg: '#14161c', sx: 2.3 }); tPeek.position.set(0.2, 3.25, -3.4); qs.add(tPeek);
const tMe = tag('なぜか、自分の隠し撮り', { size: 56, w: 680, bg: '#c8202c', sx: 2.0 }); tMe.position.set(0.2, 3.25, -3.4); qs.add(tMe);

// ---------- 2段目. 居酒屋の合コン（x=50）。女性3人は別の男性と盛り上がる。主人公の前のハートが割れる ----------
const AX = 50;
{ const fl = box(12, 0.04, 10, mat('#8a6a4a')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(12, 4.2, 0.2, mat('#c8a878')); wl.position.set(AX, 2.1, -5); qs.add(wl);
  for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), gl('#ffd890')); l.position.set(AX - 4 + i * 2, 3.4, -3.6); qs.add(l); }
  const tb = box(3.2, 0.08, 1.2, mat('#6a4a2a')); tb.position.set(AX, 0.74, -2.6); qs.add(tb);
  const tl = box(3.0, 0.7, 1.0, mat('#4a3020')); tl.position.set(AX, 0.36, -2.6); qs.add(tl);
  for (let i = 0; i < 6; i++) { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.2, 10), gl('#f0c040', 0.9)); g.position.set(AX - 1.2 + i * 0.48, 0.88, -2.6 + (i % 2 ? 0.3 : -0.3)); qs.add(g); } }
const hero2 = makePerson(HERO); hero2.position.set(AX - 0.6, 0, -1.6); hero2.rotation.y = Math.PI; qs.add(hero2);
const GIRL2 = [0, 1, 2].map(i => { const p = makePerson({ skin: ['#f4d3b5', '#f1c9a5', '#e8b98f'][i], hair: ['#2c2421', '#6a4a30', '#1a1410'][i], shirt: ['#f0c8d0', '#e8e0f0', '#f8f0d8'][i], pants: '#5a5e72', skirt: true, long: i !== 1 }); p.position.set(AX - 1.0 + i * 1.0, 0, -3.6); qs.add(p); return p; });
const RIVAL2 = makePerson({ skin: '#f1c9a5', hair: '#8a6a40', shirt: '#2a6ab0', pants: '#2a2e3a' }); RIVAL2.position.set(AX + 1.2, 0, -1.6); RIVAL2.rotation.y = Math.PI; qs.add(RIVAL2);
const HL2 = heart('#e8506a', 0.38), HR2 = heart('#e8506a', 0.38);
const t33 = tag('主人公は、33歳の会社員', { size: 54, w: 700, bg: '#14161c', sx: 2.6 }); t33.position.set(AX, 3.0, -3.8); qs.add(t33);
const tNoLuck = tag('女好きなのに、モテない', { size: 54, w: 680, bg: '#2a6ab0', sx: 2.5 }); tNoLuck.position.set(AX, 3.0, -3.8); qs.add(tNoLuck);

// ---------- 3段目. 散らかった一軒家の居間（x=100）。後輩が来て、テーブルに料理が並ぶ ----------
const BX = 100;
{ const fl = box(12, 0.04, 10, mat('#b89a70')); fl.position.set(BX, 0.02, -2); qs.add(fl);
  const wl = box(12, 4.2, 0.2, mat('#e8dcc4')); wl.position.set(BX, 2.1, -5); qs.add(wl);
  const win = box(2.2, 1.6, 0.06, gl('#bfe0f8')); win.position.set(BX - 2.6, 2.3, -4.88); qs.add(win);
  const ki = box(2.6, 0.9, 0.6, mat('#c8c8c0')); ki.position.set(BX + 2.6, 0.45, -4.5); qs.add(ki);
  const tb = box(1.8, 0.06, 1.0, mat('#8a6a4a')); tb.position.set(BX, 0.72, -2.4); qs.add(tb);
  const tl = box(1.7, 0.7, 0.9, mat('#6a4a3a')); tl.position.set(BX, 0.35, -2.4); qs.add(tl); }
const MESS3 = []; for (let i = 0; i < 12; i++) { const m = box(0.3 + (i % 3) * 0.1, 0.06 + (i % 2) * 0.1, 0.25, mat(['#e8e8e8', '#4a8ad8', '#c8a070', '#e8506a'][i % 4])); m.position.set(BX - 3 + (i * 0.53) % 6, 0.06, -0.8 - (i * 0.37) % 3); m.rotation.y = i; qs.add(m); MESS3.push(m); }
const DISH3 = []; for (let i = 0; i < 4; i++) { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.04, 16), mat('#ffffff')); g.add(p);
  const f = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(['#e8a050', '#6ab04a', '#c8502a', '#f0e0a0'][i])); f.scale.y = 0.5; f.position.y = 0.05; g.add(f); g.position.set(BX - 0.6 + i * 0.4, 0.77, -2.4 + (i % 2) * 0.2); qs.add(g); DISH3.push(g); }
const hero3 = makePerson(HERO_HOME); hero3.position.set(BX - 1.4, 0, -1.8); qs.add(hero3);
const jun3 = makePerson(JUNIOR); jun3.position.set(BX + 1.2, 0, -1.6); qs.add(jun3);
const APRON3 = box(0.44, 0.7, 0.02, mat('#2a4a6a')); APRON3.position.set(0, 1.05, 0.15); jun3.add(APRON3);
const BAG3 = box(0.5, 0.6, 0.3, mat('#5a4a3a')); BAG3.position.set(BX + 1.6, 0.35, -1.5); qs.add(BAG3);
const tShare = tag('職場の後輩と、ひとつ屋根の下', { size: 50, w: 800, bg: '#14161c', sx: 3.0 }); tShare.position.set(BX, 3.4, -3.6); qs.add(tShare);
const tChef = tag('家事も料理も、完璧な後輩', { size: 54, w: 700, bg: '#2a8a4a', sx: 2.7 }); tChef.position.set(BX, 3.4, -3.6); qs.add(tChef);

// ---------- 4段目. 夜の帰り道（x=150）。主人公の前と後ろから、ふたつの影。ハートがふたつ ----------
const CX = 150;
{ const gr = box(30, 0.04, 24, mat('#4a5060')); gr.position.set(CX, 0.02, -6); qs.add(gr);
  for (let i = 0; i < 6; i++) { const h = box(3, 3 + (i % 3), 3, mat(['#5a6070', '#6a6a7a', '#505868'][i % 3])); h.position.set(CX - 9 + i * 3.6, 1.5 + (i % 3) * 0.5, -9); qs.add(h);
    const w = box(0.8, 0.7, 0.06, gl('#ffd890')); w.position.set(CX - 9 + i * 3.6, 2.2, -7.47); qs.add(w); }
  const lp = box(0.08, 3.6, 0.08, mat('#2a2a2a')); lp.position.set(CX + 2.6, 1.8, -4); qs.add(lp);
  const lh = box(0.4, 0.2, 0.4, gl('#fff0c0')); lh.position.set(CX + 2.6, 3.6, -4); qs.add(lh); }
const LAMP4 = new THREE.SpotLight(0xfff0c0, 0, 9, 0.6, 0.5, 1); LAMP4.position.set(CX + 0.4, 4, -3.0); LAMP4.target.position.set(CX, 0, -3.4); qs.add(LAMP4); qs.add(LAMP4.target);
const hero4 = makePerson(HERO); hero4.position.set(CX, 0, -3.4); qs.add(hero4);
const SIL4 = [0, 1].map(i => { const p = makePerson({ ...SIL, scale: i ? 1.0 : 1.05 }); p.position.set(CX + (i ? 2.0 : -2.0), 0, -4.6); p.rotation.y = (i ? -1 : 1) * 0.8; qs.add(p); return p; });
const H4 = [heart('#e8506a', 0.55), heart('#ff8aa0', 0.55)];
const tConf = tag('突然の、告白', { size: 62, w: 460, bg: '#c8202c', sx: 2.6 }); tConf.position.set(CX, 3.6, -4.2); qs.add(tConf);
const tTwo = tag('しかも、ひとりじゃない', { size: 56, w: 640, bg: '#14161c', sx: 3.2 }); tTwo.position.set(CX, 3.6, -4.2); qs.add(tTwo);

// ---------- 5段目. 居間のテレビ（x=200）。夜の番組。流行語のボード ----------
const TX = 200;
{ const fl = box(12, 0.04, 10, mat('#7a5a40')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#e0d4bc')); wl.position.set(TX, 2.5, -4); qs.add(wl);
  const rack = box(3.6, 0.6, 0.6, mat('#4a3a2a')); rack.position.set(TX, 0.3, -3.5); qs.add(rack); }
const TV5 = box(3.2, 1.9, 0.12, mat('#121418')); TV5.position.set(TX, 1.65, -3.5); qs.add(TV5);
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.7), new THREE.MeshBasicMaterial({ map: canvasTex(600, 340, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a3a6a'); gr.addColorStop(1, '#e88aa0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc((i * 137) % w, (i * 53) % 180, 2 + (i % 3), 0, 7); g.fill(); }
  g.fillStyle = '#1a1c2a'; g.fillRect(0, h - 90, w, 90); for (let i = 0; i < 7; i++) g.fillRect(i * 90, h - 140 - (i % 3) * 25, 70, 60 + (i % 3) * 25); }) }));
SCR5.position.set(TX, 1.65, -3.43); qs.add(SCR5);
const H5 = []; for (let i = 0; i < 6; i++) H5.push(heart(['#e8506a', '#ff8aa0', '#f0c040'][i % 3], 0.28));
const t2018 = tag('2018年の、日本のドラマ', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 3.4 }); t2018.position.set(TX, 3.3, -3.2); qs.add(t2018);
const tTanaka = tag('主演は、田中圭', { size: 60, w: 520, bg: '#2a6ab0', sx: 2.6 }); tTanaka.position.set(TX, 3.3, -3.2); qs.add(tTanaka);

// ---------- 6段目. 居間（x=250）。左から花束を持つ白髪まじりの上司、右からエプロンの後輩。まん中で主人公があわてる ----------
const DX = 250;
{ const fl = box(10, 0.04, 8, mat('#b89a70')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4.2, 0.2, mat('#f0e0d8')); wl.position.set(DX, 2.1, -5); qs.add(wl);
  for (let i = 0; i < 5; i++) { const s = box(0.04, 4.2, 0.04, mat('#e8c8c0')); s.position.set(DX - 4 + i * 2, 2.1, -4.88); qs.add(s); } }
const hero6 = makePerson(HERO_HOME); hero6.position.set(DX, 0, -1.8); qs.add(hero6);
const boss6 = makePerson(BOSS); boss6.position.set(DX - 1.2, 0, -2.4); qs.add(boss6);
const jun6 = makePerson(JUNIOR); jun6.position.set(DX + 1.2, 0, -2.4); qs.add(jun6);
const APRON6 = box(0.44, 0.7, 0.02, mat('#2a4a6a')); APRON6.position.set(0, 1.05, 0.15); jun6.add(APRON6);
const BQ6 = new THREE.Group(); { for (let i = 0; i < 7; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), gl(['#e8506a', '#ff8aa0', '#ffffff'][i % 3])); f.position.set(Math.cos(i) * 0.12, 0.12 + (i % 3) * 0.05, Math.sin(i) * 0.12); BQ6.add(f); }
  const st = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 8), mat('#5a8a4a')); st.rotation.x = Math.PI; st.position.y = -0.12; BQ6.add(st); }
BQ6.position.set(0, -0.66, 0.12); boss6.userData.arms[1].add(BQ6);
const HB6 = heart('#e8506a', 0.4), HJ6 = heart('#ff8aa0', 0.4);
const SWEAT6 = []; for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), gl('#8ac8f0')); s.scale.y = 1.6; qs.add(s); SWEAT6.push(s); }
const tBoss = tag('告白は、55歳の男性上司から', { size: 52, w: 760, bg: '#c8202c', sx: 2.8 }); tBoss.position.set(DX, 3.5, -3.4); qs.add(tBoss);
const tJun = tag('そして、同居中の後輩男子', { size: 54, w: 700, bg: '#2a6ab0', sx: 2.6 }); tJun.position.set(DX, 3.5, -3.4); qs.add(tJun);

// ---------- shots ----------
const ALL = [tPeek, tMe, t33, tNoLuck, tShare, tChef, tConf, tTwo, t2018, tTanaka, tBoss, tJun, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); HEARTS.forEach(h => h.visible = false); LAMP4.intensity = 0; }

function shotOffice(t, quiz = 0) { // 1段目 0〜9：上司のスマホをのぞくと、待ち受けはなぜか自分の隠し撮り（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.2;
  boss1.rotation.y = 0.15; boss1.userData.arms[1].rotation.x = -1.1; boss1.userData.head.rotation.x = 0.35;
  hero1.rotation.y = -0.7; hero1.userData.head.rotation.x = 0.2;
  const zk = quiz ? 0.6 : ease(clamp((t - 4.6) / 0.8));
  PH1.position.set(lerp(-0.25, 0.1, zk), lerp(1.75, 2.0, zk), lerp(-3.55, -2.6, zk)); PH1.rotation.set(lerp(-0.5, 0, zk), lerp(0.2, 0, zk), 0); PH1.scale.setScalar(lerp(0.45, 1.0, zk));
  hero1.userData.legs.forEach(l => l.rotation.x = 0); if (!quiz && t > 5.2) { hero1.position.z = -2.6 + Math.sin((t - 5.2) * 20) * 0.01 * (t < 6 ? 1 : 0); }
  Q1.position.set(1.0, 2.55, -2.3); Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3); if (!quiz && t > 4.6) Q1.visible = false;
  if (!quiz) { tPeek.userData.pop((t - 1.8) / 0.35); if (t > 4.6) tPeek.visible = false; tMe.userData.pop((t - 4.8) / 0.35); }
  const u = ease(t / 9);
  look(lerp(1.0, 0.7, u), lerp(2.1, 2.0, u), lerp(1.4, 0.8, u), 0, 1.7, -3.4, 60);
  return qs;
}
function shotParty(t) { // 2段目 9〜17：主人公は、33歳の会社員。女好きなのに、まったくモテない
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.0;
  GIRL2.forEach((p, i) => { p.rotation.y = 0.5; p.userData.arms[i % 2].rotation.x = -0.6 - Math.abs(Math.sin(t * 4 + i)) * 0.6; p.userData.head.rotation.y = 0.4; });
  RIVAL2.userData.arms[0].rotation.x = -2.0 + Math.sin(t * 5) * 0.3;
  hero2.userData.head.rotation.y = 0.3 + Math.sin(t * 1.2) * 0.2; hero2.userData.arms[1].rotation.x = t > 4.4 ? -0.2 : -1.5;
  const brk = clamp((t - 4.6) / 0.6);
  HL2.position.set(AX - 0.6 - brk * 0.25, 2.6 - brk * 0.3, -1.4); HR2.position.set(AX - 0.6 + brk * 0.25, 2.6 - brk * 0.3, -1.4);
  HL2.rotation.z = brk * 0.5; HR2.rotation.z = -brk * 0.5; HL2.material.color.set(brk > 0 ? '#7a6a7a' : '#e8506a');
  [HL2, HR2].forEach(h => { h.visible = t > 3.9; h.rotation.y = Math.PI; });
  t33.userData.pop((t - 0.4) / 0.35); if (t > 4.0) t33.visible = false; tNoLuck.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.4, -0.2, u), lerp(2.2, 2.1, u), lerp(1.8, 1.0, u), AX - 0.1, 1.5, -2.8, 66);
  return qs;
}
function shotHome(t) { // 3段目 17〜25：散らかった実家に、職場の後輩が同居。家事も料理も、完璧な後輩
  base(); S.aim(BX, -3); lift(0); S.hemi.intensity = 1.2;
  const w = clamp(t / 3.6);
  jun3.position.set(lerp(BX + 3.4, BX + 1.2, ease(w)), 0, -1.6); jun3.rotation.y = -Math.PI / 2 * (1 - w) + 0.2; poseWalk(jun3, t * 6, w < 1 ? 0.6 : 0);
  APRON3.visible = t > 4.0; BAG3.visible = t < 4.0; BAG3.position.set(jun3.position.x + 0.35, 0.35, -1.5);
  MESS3.forEach((m, i) => { const k = clamp((t - 4.0 - i * 0.12) / 0.3); m.visible = k < 1; });
  DISH3.forEach((d, i) => { const k = ease(clamp((t - 4.4 - i * 0.35) / 0.3)); d.visible = k > 0; d.scale.setScalar(Math.max(0.01, k)); });
  hero3.rotation.y = 0.5; hero3.userData.head.rotation.y = 0.3; hero3.userData.arms.forEach((a, i) => a.rotation.z = (i ? 1 : -1) * (t > 4.4 ? 0.5 : 0));
  jun3.userData.arms.forEach(a => a.rotation.x = t > 4.4 ? -0.9 : a.rotation.x);
  tShare.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tShare.visible = false; tChef.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0.6, 0.2, u), lerp(2.4, 2.3, u), lerp(3.0, 2.4, u), BX, 1.3, -2.4, 66);
  return qs;
}
function shotNight(t) { // 4段目 25〜33：突然の告白。しかも、ひとりからじゃない
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 0.45; S.darken(0.6, '#0a0c18'); LAMP4.intensity = 30;
  hero4.rotation.y = 0; hero4.userData.head.rotation.y = t < 4 ? -0.6 : 0.6;
  SIL4.forEach((p, i) => { const k = ease(clamp((t - (i ? 4.2 : 0.4)) / 1.2)); p.visible = k > 0; p.position.set(CX + (i ? lerp(3.4, 1.3, k) : lerp(-3.4, -1.3, k)), 0, -3.8); poseWalk(p, t * 5, k < 1 ? 0.5 : 0); p.rotation.y = (i ? -1 : 1) * 1.2; });
  H4.forEach((h, i) => { const k = ease(clamp((t - (i ? 5.0 : 1.4)) / 0.4)); h.visible = k > 0; h.scale.setScalar(0.55 * k * (1 + Math.sin(t * 6) * 0.06)); h.position.set(CX + (i ? 0.9 : -0.9), 2.3, -3.6); });
  tConf.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tConf.visible = false; tTwo.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.4, 0.0, u), lerp(2.0, 2.2, u), lerp(2.8, 2.2, u), CX, 1.6, -3.8, 70);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2018年の、日本のドラマ。主演は田中圭。その年の流行語にも
  base(); S.aim(TX, 0); lift(0); S.hemi.intensity = 0.8; S.darken(0.3, '#2a2e38');
  H5.forEach((h, i) => { h.visible = true; const a = i / 6 * Math.PI * 2 + t * 0.6; h.position.set(TX + Math.cos(a) * 2.0, 1.7 + Math.sin(a) * 1.1, -3.2); h.rotation.z = Math.sin(t * 2 + i) * 0.3; });
  t2018.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2018.visible = false; tTanaka.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.6, lerp(2.6, 2.4, u), lerp(5.4, 4.6, u), TX + 0.3, 1.9, -3.2, 62);
  return qs;
}
function shotTwo(t) { // 6段目 42〜49（決め手）：告白してきたのは、乙女心をもつ55歳の部長。そして、同居中の後輩男子
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 1.3;
  const kb = ease(clamp((t - 0.2) / 1.0)), kj = ease(clamp((t - 3.6) / 1.0));
  boss6.position.set(lerp(DX - 3.2, DX - 1.2, kb), 0, -2.4); boss6.rotation.y = 1.0; poseWalk(boss6, t * 6, kb < 1 ? 0.5 : 0); boss6.userData.arms[1].rotation.x = -1.2; boss6.userData.head.rotation.z = kb * 0.15;
  jun6.position.set(lerp(DX + 3.2, DX + 1.2, kj), 0, -2.4); jun6.rotation.y = -1.0; poseWalk(jun6, t * 6, kj > 0 && kj < 1 ? 0.5 : 0); jun6.userData.arms[0].rotation.x = kj > 0.9 ? -1.0 : jun6.userData.arms[0].rotation.x;
  HB6.visible = kb > 0.9; HB6.position.set(DX - 1.2, 2.45 + Math.sin(t * 4) * 0.05, -2.4);
  HJ6.visible = kj > 0.9; HJ6.position.set(DX + 1.2, 2.45 + Math.sin(t * 4 + 1) * 0.05, -2.4);
  hero6.rotation.y = 0; hero6.userData.head.rotation.y = t < 3.6 ? -0.5 : 0.5; hero6.userData.arms.forEach((a, i) => { a.rotation.x = -0.8; a.rotation.z = (i ? 1 : -1) * 0.4; });
  SWEAT6.forEach((s, i) => { s.visible = t > 1.2; s.position.set(DX + (i - 1) * 0.28, 2.15 + ((t * 1.4 + i * 0.3) % 1) * -0.3, -1.6); });
  if (t < 3.6) tBoss.userData.pop((t - 0.3) / 0.35); else tJun.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.2, 0.2, u), lerp(2.0, 1.9, u), lerp(3.0, 2.6, u), DX, 1.5, -2.6, 66);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（オフィスに戻る）
  shotOffice(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotOffice(t, 0) },
  { a: 9, b: 17, f: shotParty },
  { a: 17, b: 25, f: shotHome },
  { a: 25, b: 33, f: shotNight },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotTwo },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'ある日、上司のスマホを<br>見てしまう。'],
  [5.6, 9.0, '待ち受けは、なぜか<br>自分の隠し撮り。'],
  [9.2, 13.2, '主人公は、<br>33歳の会社員。'],
  [13.2, 17.0, '女好きなのに、<br>まったくモテない。'],
  [17.2, 21.0, '散らかった実家に、<br>職場の後輩が同居。'],
  [21.0, 25.0, '後輩は、<br>家事も料理も完璧。'],
  [25.2, 29.0, 'そんなある日、<br>突然の告白。'],
  [29.0, 33.0, 'しかも告白は、<br>ひとりからじゃない。'],
  [33.2, 37.4, '2018年の、<br>日本のドラマ。'],
  [37.4, 41.8, '主演は田中圭。<br>その年の流行語にも。'],
  [42.2, 45.4, '告白したのは、<br>乙女心をもつ55歳の部長。'],
  [45.4, 49.0, 'そして、<br>同居中の後輩男子。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>おっさんずラブ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q107', v2: true, answer: 'おっさんずラブ',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 10710,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '上司': 'じょうし', '見て': 'みて', '待ち受け': 'まちうけ', '自分': 'じぶん', '隠し撮り': 'かくしどり', '主人公': 'しゅじんこう', '33歳': 'さんじゅうさんさい', '会社員': 'かいしゃいん', '女好き': 'おんなずき', '散らかった': 'ちらかった', '実家': 'じっか', '職場': 'しょくば', '後輩': 'こうはい', '同居': 'どうきょ', '家事': 'かじ', '料理': 'りょうり', '完璧': 'かんぺき', '突然': 'とつぜん', '告白': 'こくはく', '2018年': 'にせんじゅうはちねん', '日本': 'にほん', '主演': 'しゅえん', '田中圭': 'たなかけい', 'その年': 'そのとし', '流行語': 'りゅうこうご', '乙女心': 'おとめごころ', '55歳': 'ごじゅうごさい', '部長': 'ぶちょう', '同居中': 'どうきょちゅう', '男子': 'だんし', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', 'おっさんずラブ': 'おっさんずらぶ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\nある日、上司のスマホを見てしまう。待ち受けは、なぜか自分の隠し撮り。主人公は、33歳の会社員。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'Netflix', 'ドラマ好き', '日本のドラマ'],
  },
});
applyQuizCards({ answer: 'おっさんずラブ', info: 'U-NEXT・Netflix｜日本のドラマ', answerSize: 120 });
