import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #106 キングスマン（映画・イギリス／アメリカ・2014年製作・日本公開2015年9月11日・129分。Prime Video・Disney+・Hulu で見放題、
//   Filmarks の動画配信欄（Prime Video・ディズニープラス・Hulu 見放題）と Disney+ の作品ページ disneyplus.com/ja-jp/movies/kingsman-the-secret-service で2026/11/18確認。
//   Filmarks 4.1・レビュー274,229件 filmarks.com/movies/59360）
// 確かめた事実（Filmarks の作品紹介 filmarks.com/movies/59360、Wikipedia 日本語版 キングスマン の ストーリー・キャスト。2026/11/18）：
//   ・ロンドンの高級テーラー キングスマン。その裏の顔は、どこの国にも属さない世界最強のスパイ機関（Filmarks）
//   ・ブリティッシュ・スーツを着こなすエリートスパイのハリー（コリン・ファース）が、街の若者エグジー（タロン・エガートン）を候補生にスカウト。ハリーは死んだエグジーの父と旧知の仲（Filmarks）
//   ・エグジーは街の不良として荒んだ生活。優れた知能や身体能力を持ちながら活かせていない（Wikipedia）
//   ・車を盗んで逮捕されたエグジーが、幼い頃に渡されたメダルの裏の番号に電話すると、まもなく釈放される。警察署の外で待っていたのはオーダースーツのハリー（Wikipedia）
//   ・サヴィル・ロウの高級テーラーに呼ばれ、テーラーの地下深くから本部へ。候補生の試験は過酷（Wikipedia）
// 構成（ヒント6段）：1 捕まった若者が、メダルの番号に電話しただけで釈放 → 2 主人公はくすぶる若者・能力はあるのに活かせていない
//   → 3 待っていたのはスーツの紳士・高級な仕立て屋に呼ばれる → 4 紳士は亡き父の古い知り合い・ある組織の候補生として過酷な試験
//   → 5 2015年に日本で公開されたスパイアクション・ロンドンが舞台・出演はコリン・ファース（製作国はイギリス・アメリカ） → 6 決め手：仕立て屋の地下はスパイ組織の本部・紳士の武器はスーツと傘
// 敵の計画・試験の結末・教会の場面・登場人物の生死・結末は言わない。人物名・組織名・地名（5段目まで）・タイトルの文字は出さない。
// 俳優の顔・ポスター・ロゴ・劇中の有名な場面の構図（酒場で傘を使う場面など）は使わない。人は汎用の3D
const S = quizStage({ bg: '#1c2230', floor: '#2a303c', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(10610);

const YOUTH = { skin: '#f1c9a5', hair: '#8a6a40', shirt: '#e6b450', pants: '#3a4a6a' };
const GENT = { skin: '#f1c9a5', hair: '#3a2e26', shirt: '#2a3448', pants: '#2a3448', tie: true };
const CAND = [{ skin: '#f4d3b5', hair: '#1a1410', shirt: '#e8e8e8', pants: '#3a3e48' }, { skin: '#e8b98f', hair: '#c89a50', shirt: '#e8e8e8', pants: '#3a3e48' }, { skin: '#f4d3b5', hair: '#2c2421', shirt: '#e8e8e8', pants: '#3a3e48', skirt: true, long: true }, { skin: '#f1c9a5', hair: '#5a3a20', shirt: '#e8e8e8', pants: '#3a3e48' }];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
// 紳士の黒い傘（閉じた状態）
function umbrella() { const g = new THREE.Group(); const k = mat('#14161c');
  const sh = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.85, 10), k);
  const rg = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 12), mat('#e6b450')); rg.rotation.x = Math.PI / 2; rg.position.y = -0.1; g.add(rg); sh.position.y = -0.45; sh.rotation.x = Math.PI; g.add(sh);
  const rod = box(0.025, 0.25, 0.025, mat('#8a8a8a')); rod.position.y = -0.95; g.add(rod);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 6, 12, Math.PI), mat('#5a3a20')); hd.position.set(0.07, 0, 0); g.add(hd); return g; }
// メガネ（頭に付ける）
function glasses(p) { const g = new THREE.Group(); for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 6, 16), mat('#14161c')); f.position.set(s * 0.085, 0.27, 0.205); g.add(f); }
  const br = box(0.06, 0.012, 0.01, mat('#14161c')); br.position.set(0, 0.28, 0.205); g.add(br); p.userData.head.add(g); return g; }
// 金色のメダル
function medal() { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 24), new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.8, roughness: 0.3 })); m.rotation.x = Math.PI / 2; g.add(m);
  const r = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 6, 24), mat('#c8902a')); g.add(r);
  const nb = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.12), new THREE.MeshBasicMaterial({ map: canvasTex(240, 96, (c, w, h) => { c.fillStyle = '#c8902a'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a2a10'; c.font = 'bold 44px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('☎ · · · ·', w / 2, h / 2); }), transparent: true }));
  nb.position.z = 0.025; g.add(nb); return g; }

// ---------- 1段目. 夜の警察署の前（x=0）。青いランプ。扉から若者が出てくる。メダルと？ ----------
{ const gr = box(24, 0.04, 20, mat('#3a3e48')); gr.position.set(0, 0.02, -4); qs.add(gr);
  const bd = box(10, 6, 3, mat('#7a7e8a')); bd.position.set(0, 3, -8); qs.add(bd);
  const st = box(3.2, 0.3, 1.2, mat('#7a7e88')); st.position.set(0, 0.15, -6.0); qs.add(st);
  const dr = box(1.6, 2.4, 0.1, mat('#2a3040')); dr.position.set(0, 1.5, -6.48); qs.add(dr);
  for (let i = 0; i < 4; i++) { const w = box(1.0, 1.0, 0.06, gl(i % 2 ? '#ffe0a0' : '#3a4050')); w.position.set(-3.6 + i * 2.4 + (i > 1 ? 0.0 : 0), 4.2, -6.47); qs.add(w); }
  for (const s of [-1, 1]) { const p = box(0.08, 3.2, 0.08, mat('#2a2e38')); p.position.set(s * 4.6, 1.6, -4.2); qs.add(p); } }
const LAMP1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), gl('#3a8aff')); LAMP1.position.set(0, 3.1, -6.3); qs.add(LAMP1);
const BLUE1 = new THREE.PointLight(0x3a8aff, 0, 9, 1.4); BLUE1.position.set(0, 3.0, -5.6); qs.add(BLUE1);
const youth1 = makePerson(YOUTH); qs.add(youth1);
const MEDAL1 = medal(); qs.add(MEDAL1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.5 }); qs.add(Q1);
const tFree = tag('捕まった若者が、すぐ釈放', { size: 54, w: 720, bg: '#14161c', sx: 2.6 }); tFree.position.set(0, 3.3, -4.6); qs.add(tFree);
const tCall = tag('メダルの番号に、電話しただけ', { size: 50, w: 800, bg: '#c8202c', sx: 2.8 }); tCall.position.set(0, 3.3, -4.6); qs.add(tCall);

// ---------- 2段目. 団地の中庭（x=50）。フードの若者が壁にもたれて座る。サッカーボール ----------
const AX = 50;
{ const gr = box(24, 0.04, 20, mat('#6a6e74')); gr.position.set(AX, 0.02, -4); qs.add(gr);
  for (let i = 0; i < 2; i++) { const b = box(8, 9, 3, mat('#8a7a6a')); b.position.set(AX - 5 + i * 10, 4.5, -9); qs.add(b);
    for (let f = 0; f < 4; f++) for (let w = 0; w < 4; w++) { const wn = box(0.9, 0.9, 0.06, gl((f + w + i) % 3 ? '#4a5060' : '#ffd890')); wn.position.set(AX - 7.6 + i * 10 + w * 1.8, 1.6 + f * 2, -7.47); qs.add(wn); } }
  const wl = box(6, 1.0, 0.3, mat('#9a948a')); wl.position.set(AX, 0.5, -4.2); qs.add(wl); }
const youth2 = makePerson(YOUTH); youth2.position.set(AX, 0.55, -3.8); qs.add(youth2);
const HOOD2 = box(0.46, 0.22, 0.44, mat('#e6b450')); HOOD2.position.set(0, 0.5, -0.04); youth2.userData.head.add(HOOD2);
const BALL2 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), mat('#f0f0f0')); qs.add(BALL2);
const STAR2 = []; for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), gl('#ffe070')); qs.add(s); STAR2.push(s); }
const tYouth = tag('主人公は、くすぶる若者', { size: 54, w: 680, bg: '#14161c', sx: 2.4 }); tYouth.position.set(AX, 3.2, -4.4); qs.add(tYouth);
const tSkill = tag('能力はあるのに、活かせない', { size: 52, w: 760, bg: '#2a6ab0', sx: 2.6 }); tSkill.position.set(AX, 3.2, -4.4); qs.add(tSkill);

// ---------- 3段目. 霧の石畳の通り（x=100）。仕立て屋のショーウインドウ（スーツのトルソー）。紳士が待つ ----------
const BX = 100;
{ const gr = box(24, 0.04, 20, mat('#6a6a6e')); gr.position.set(BX, 0.02, -4); qs.add(gr);
  for (let i = 0; i < 14; i++) { const ln = box(24, 0.01, 0.03, mat('#5a5a5e')); ln.position.set(BX, 0.045, -9 + i * 0.8); qs.add(ln); }
  const sh = box(8, 5, 2, mat('#2a3a30')); sh.position.set(BX, 2.5, -7); qs.add(sh);
  const fr = box(8.2, 0.5, 0.2, mat('#1e2a22')); fr.position.set(BX, 3.9, -5.92); qs.add(fr);
  const win = box(4.0, 2.4, 0.06, gl('#ffe8b8')); win.position.set(BX - 1.4, 1.9, -5.95); qs.add(win);
  const dr = box(1.2, 2.6, 0.1, mat('#1a221c')); dr.position.set(BX + 2.4, 1.3, -5.94); qs.add(dr);
  for (const s of [-1, 1]) { const b = box(10, 6, 2, mat('#7a6a5a')); b.position.set(BX + s * 9, 3, -7); qs.add(b); }
  const lp = box(0.08, 3.4, 0.08, mat('#1a1a1a')); lp.position.set(BX - 4.2, 1.7, -4.4); qs.add(lp);
  const lh = box(0.3, 0.4, 0.3, gl('#ffe0a0')); lh.position.set(BX - 4.2, 3.5, -4.4); qs.add(lh); }
const TORSO3 = []; for (let i = 0; i < 2; i++) { const g = new THREE.Group(); const b = box(0.55, 0.75, 0.3, mat(i ? '#3a3a4a' : '#2a3448')); b.position.y = 1.7; g.add(b);
  const l = box(0.2, 0.5, 0.02, mat('#e8e8e8')); l.position.set(0, 1.85, 0.16); g.add(l); const st = box(0.05, 1.3, 0.05, mat('#8a6a40')); st.position.y = 0.65; g.add(st);
  g.position.set(BX - 2.6 + i * 1.6, 0, -5.6); qs.add(g); TORSO3.push(g); }
const gent3 = makePerson(GENT); gent3.position.set(BX + 1.0, 0, -4.0); glasses(gent3); qs.add(gent3);
const youth3 = makePerson(YOUTH); youth3.position.set(BX, 0, -2); qs.add(youth3);
const FOG3 = []; for (let i = 0; i < 10; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), gl('#c8ccd4', 0.18)); f.position.set(BX - 6 + i * 1.4, 0.4, -3 - (i % 3)); f.scale.set(1.6, 0.4, 1); qs.add(f); FOG3.push(f); }
const tGent = tag('待っていたのは、スーツの紳士', { size: 50, w: 820, bg: '#14161c', sx: 4.2 }); tGent.position.set(BX, 4.8, -5.4); qs.add(tGent);
const tTailor = tag('呼ばれた先は、仕立て屋', { size: 54, w: 660, bg: '#c8202c', sx: 3.6 }); tTailor.position.set(BX, 4.8, -5.4); qs.add(tTailor);

// ---------- 4段目. 広い訓練場（x=150）。白い服の候補生が一列。紳士がその前に立つ。古い写真 ----------
const CX = 150;
{ const fl = box(18, 0.04, 14, mat('#8a8e94')); fl.position.set(CX, 0.02, -3); qs.add(fl);
  const wl = box(18, 7, 0.2, mat('#5a6068')); wl.position.set(CX, 3.5, -8); qs.add(wl);
  for (let i = 0; i < 5; i++) { const ln = box(0.06, 0.01, 10, mat('#e8e8e8')); ln.position.set(CX - 4 + i * 2, 0.045, -3); qs.add(ln); } }
const CAND4 = CAND.map((c, i) => { const p = makePerson(c); p.position.set(CX - 2.6 + i * 1.3 + (i > 1 ? 1.3 : 0), 0, -5.2); qs.add(p); return p; });
const youth4 = makePerson(YOUTH); youth4.position.set(CX - 0.0, 0, -5.2); qs.add(youth4);
const gent4 = makePerson(GENT); gent4.position.set(CX + 2.3, 0, -3.0); gent4.rotation.y = -Math.PI * 0.75; glasses(gent4); qs.add(gent4);
const PHOTO4 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshBasicMaterial({ map: canvasTex(280, 200, (c, w, h) => {
  c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, w, h); c.fillStyle = '#c8b890'; c.fillRect(14, 14, w - 28, h - 28);
  c.fillStyle = '#6a5a40'; for (const x of [100, 180]) { c.beginPath(); c.arc(x, 80, 22, 0, 7); c.fill(); c.fillRect(x - 28, 104, 56, 70); } }), transparent: true }));
qs.add(PHOTO4);
const tFather = tag('紳士は、亡き父の知り合い', { size: 54, w: 700, bg: '#14161c', sx: 3.8 }); tFather.position.set(CX, 4.6, -5.6); qs.add(tFather);
const tTest = tag('候補生の、過酷な試験', { size: 56, w: 640, bg: '#c8202c', sx: 3.6 }); tTest.position.set(CX, 4.6, -5.6); qs.add(tTest);

// ---------- 5段目. 映画館（x=200）。スクリーンに霧の街と時計塔のシルエット ----------
const TX = 200;
{ const fl = box(14, 0.04, 14, mat('#1e1a22')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#2a2230')); wl.position.set(TX, 4, -5); qs.add(wl);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const s = box(0.7, 0.8, 0.6, mat('#5a1a2a')); s.position.set(TX - 2.9 + i * 1.15, 0.4 + r * 0.25, 2.4 + r * 1.1); qs.add(s); } }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(720, 360, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5a6a80'); gr.addColorStop(1, '#c8ccd0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2a2e38'; g.fillRect(0, 250, w, 110);
  for (let i = 0; i < 9; i++) g.fillRect(i * 80 + 10, 210 - (i % 3) * 22, 60, 60 + (i % 3) * 22);
  g.fillRect(470, 90, 44, 170); g.beginPath(); g.moveTo(462, 92); g.lineTo(492, 40); g.lineTo(522, 92); g.fill();
  g.fillStyle = '#e8e0c0'; g.beginPath(); g.arc(492, 120, 15, 0, 7); g.fill();
  g.fillStyle = 'rgba(230,234,240,.35)'; g.fillRect(0, 230, w, 40); }) }));
SCR5.position.set(TX, 3.6, -4.85); qs.add(SCR5);
const t2015 = tag('2015年公開の、スパイ映画', { size: 54, w: 740, bg: '#e6b450', color: '#14161c', sx: 5.0 }); t2015.position.set(TX, 6.4, -4.4); qs.add(t2015);
const tFirth = tag('出演は、コリン・ファース', { size: 54, w: 700, bg: '#2a6ab0', sx: 4.8 }); tFirth.position.set(TX, 6.4, -4.4); qs.add(tFirth);

// ---------- 6段目. 仕立て屋の試着室（x=250）。鏡の壁が開き、地下へのエレベーター。紳士はスーツと傘 ----------
const DX = 250;
{ const fl = box(10, 0.04, 8, mat('#6a4a30')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(10, 4.4, 0.2, mat('#3a4a3c')); wl.position.set(DX, 2.2, -5.4); qs.add(wl);
  for (let i = 0; i < 6; i++) { const r = box(0.04, 4.4, 0.04, mat('#2a3a2c')); r.position.set(DX - 4.5 + i * 1.8, 2.2, -5.28); qs.add(r); }
  for (let i = 0; i < 5; i++) { const b = box(0.5, 0.06, 0.4, mat(['#e8e0d0', '#8a9ab0', '#c8a888'][i % 3])); b.position.set(DX - 3.2, 1.0 + i * 0.07, -3.6); qs.add(b); }
  const tb = box(1.4, 0.8, 0.8, mat('#5a3a20')); tb.position.set(DX - 3.2, 0.4, -3.6); qs.add(tb); }
const PIT6 = box(1.6, 0.04, 1.6, gl('#ffe8a0')); PIT6.position.set(DX + 0.6, 0.03, -4.4); qs.add(PIT6);
const DOOR6 = [0, 1].map(i => { const d = box(0.8, 3.0, 0.08, new THREE.MeshStandardMaterial({ color: '#dfe8f0', metalness: 0.7, roughness: 0.12 })); d.position.set(DX + 0.2 + i * 0.8, 1.5, -5.2); qs.add(d); return d; });
const GLOW6 = box(1.6, 3.0, 0.04, gl('#ffd890', 0.85)); GLOW6.position.set(DX + 0.6, 1.5, -5.28); qs.add(GLOW6);
const gent6 = makePerson(GENT); gent6.position.set(DX - 0.6, 0, -2.6); glasses(gent6); qs.add(gent6);
const UMB6 = umbrella(); UMB6.scale.setScalar(1.25); UMB6.position.set(0, -0.62, 0.06); gent6.userData.arms[1].add(UMB6);
const SPOT6 = new THREE.SpotLight(0xfff0d0, 0, 8, 0.5, 0.5, 1); SPOT6.position.set(DX - 0.6, 4.2, -0.6); SPOT6.target.position.set(DX - 0.6, 1.0, -2.6); qs.add(SPOT6); qs.add(SPOT6.target);
const youth6 = makePerson(YOUTH); youth6.position.set(DX + 1.4, 0, -2.2); qs.add(youth6);
const tBase = tag('仕立て屋の地下は、スパイの本部', { size: 50, w: 860, bg: '#c8202c', sx: 3.3 }); tBase.position.set(DX + 0.1, 3.7, -4.0); qs.add(tBase);
const tUmb = tag('紳士の武器は、スーツと傘', { size: 54, w: 720, bg: '#2a6ab0', sx: 2.9 }); tUmb.position.set(DX + 0.1, 3.7, -4.0); qs.add(tUmb);

// ---------- shots ----------
const ALL = [tFree, tCall, tYouth, tSkill, tGent, tTailor, tFather, tTest, t2015, tFirth, tBase, tUmb, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); BLUE1.intensity = 0; }

function shotStation(t, quiz = 0) { // 1段目 0〜9：捕まった若者が、すぐ釈放。子どものころのメダルの番号に電話しただけ（0秒目がサムネ）
  base(); S.aim(0, -4); lift(0); S.hemi.intensity = 0.55; S.darken(0.55, '#05070e'); BLUE1.intensity = 6;
  LAMP1.material.color.set(Math.floor(t * 2) % 2 ? '#3a8aff' : '#6ab0ff');
  const w = quiz ? 0.6 : clamp(t / 4.5);
  youth1.position.set(0.1, 0.3, lerp(-6.0, -3.4, ease(w))); youth1.rotation.y = 0; poseWalk(youth1, t * 5, quiz ? 0 : (w < 1 ? 0.6 : 0)); youth1.position.y += 0.0;
  if (youth1.position.z > -5.4) youth1.position.y = 0;
  youth1.userData.head.rotation.y = quiz ? 0.2 : (w >= 1 ? Math.sin(t * 1.8) * 0.5 : 0);
  const mk = quiz ? 1 : ease(clamp((t - 4.6) / 0.6));
  MEDAL1.visible = mk > 0; MEDAL1.scale.setScalar(Math.max(0.01, mk)); MEDAL1.position.set(-0.75, 1.9 + Math.sin(t * 2) * 0.04, youth1.position.z + 0.3); MEDAL1.rotation.y = quiz ? 0.3 : Math.sin(t * 1.5) * 0.5;
  Q1.position.set(0.85, 2.15, youth1.position.z); Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3); if (!quiz && t > 4.6) Q1.visible = false;
  if (!quiz) { tFree.userData.pop((t - 1.8) / 0.35); if (t > 4.6) tFree.visible = false; tCall.userData.pop((t - 4.8) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.5, 0.2, u), lerp(1.9, 1.8, u), lerp(0.6, 0.0, u), 0, 1.6, -4.4, 62);
  return qs;
}
function shotYard(t) { // 2段目 9〜17：主人公は、くすぶる若者。能力はあるのに、活かせていない
  base(); S.aim(AX, -4); lift(0); S.hemi.intensity = 0.9; S.darken(0.25, '#2a2e38');
  youth2.rotation.y = 0; youth2.userData.legs.forEach(l => l.rotation.x = -1.4); youth2.position.y = 0.55;
  youth2.userData.head.rotation.x = t < 4 ? 0.35 : -0.15; youth2.userData.arms.forEach((a, i) => a.rotation.x = -0.6);
  const bt = (t * 1.6) % 1; BALL2.position.set(AX + 1.3, 0.14 + Math.abs(Math.sin(t * 3.2)) * 0.6, -3.2);
  STAR2.forEach((s, i) => { const k = clamp((t - 4.4) / 0.5); s.visible = k > 0; const a = i / 6 * Math.PI * 2 + t; s.position.set(AX + Math.cos(a) * 0.55, 2.25 + Math.sin(a) * 0.25, -3.8); s.scale.setScalar(k); s.rotation.y = t * 3; });
  tYouth.userData.pop((t - 0.4) / 0.35); if (t > 4.0) tYouth.visible = false; tSkill.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.8, -0.3, u), lerp(1.8, 1.9, u), lerp(0.4, -0.4, u), AX, 1.7, -4.2, 62);
  return qs;
}
function shotStreet(t) { // 3段目 17〜25：待っていたのは、スーツの紳士。呼ばれた先は、高級な仕立て屋
  base(); S.aim(BX, -5); lift(0); S.hemi.intensity = 0.8; S.darken(0.35, '#3a404c');
  FOG3.forEach((f, i) => { f.position.x = BX - 7 + ((i * 1.4 + t * 0.3) % 14); });
  const w = clamp((t - 0.5) / 5);
  youth3.position.set(BX - 1.6 + w * 1.4, 0, lerp(-1.0, -3.6, ease(w))); youth3.rotation.y = Math.PI + 0.3; poseWalk(youth3, t * 5, w < 1 ? 0.5 : 0);
  gent3.rotation.y = 0.2 + Math.sin(t * 0.5) * 0.1;
  tGent.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tGent.visible = false; tTailor.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.4, 0.2, u), lerp(2.2, 2.3, u), lerp(2.0, 1.4, u), BX, 2.1, -5.2, 64);
  return qs;
}
function shotTrain(t) { // 4段目 25〜33：紳士は、亡き父の古い知り合い。若者は候補生に選ばれ、過酷な試験へ
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 1.0;
  const pk = t < 4.0 ? ease(clamp((t - 0.3) / 0.6)) : 1 - ease(clamp((t - 3.8) / 0.4));
  PHOTO4.visible = pk > 0.01; PHOTO4.scale.setScalar(Math.max(0.01, pk)); PHOTO4.position.set(CX + 1.5, 2.6, -2.6);
  CAND4.forEach((p, i) => { p.rotation.y = 0; p.userData.arms.forEach(a => a.rotation.x = t > 4.4 ? -0.1 + Math.sin(t * 6 + i) * 0.05 : 0); });
  const run = t > 4.4; [...CAND4, youth4].forEach((p, i) => { if (run) { p.position.z = -5.2 + Math.sin((t - 4.4) * 5 + i) * 0.04; poseWalk(p, t * 9 + i, 0.7); } });
  gent4.userData.arms[1].rotation.x = t > 4.4 ? -1.4 : 0;
  tFather.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tFather.visible = false; tTest.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(1.4, 1.0, u), lerp(2.2, 2.5, u), lerp(3.0, 3.8, u), CX + 0.6, 1.8, -4.8, 70);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2015年に日本で公開されたスパイ映画。ロンドンが舞台。出演はコリン・ファース
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.6, '#08060a');
  t2015.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2015.visible = false; tFirth.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 3.0, u), lerp(6.8, 6.0, u), TX, 4.0, -4.8, 68);
  return qs;
}
function shotFitting(t) { // 6段目 42〜49（決め手）：高級な仕立て屋の地下は、スパイ組織の本部。紳士の武器は、スーツと傘
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.9;
  const op = ease(clamp((t - 0.6) / 1.2));
  DOOR6[0].position.x = DX + 0.2 - op * 0.75; DOOR6[1].position.x = DX + 1.0 + op * 0.75; GLOW6.visible = op > 0.02;
  gent6.rotation.y = 0.35; SPOT6.intensity = 18;
  const ra = ease(clamp((t - 3.7) / 0.5)); gent6.userData.arms[1].rotation.x = lerp(-0.15, -1.25, ra); gent6.userData.arms[1].rotation.z = ra * 0.25;
  UMB6.rotation.x = lerp(0, -0.35, ra);
  youth6.rotation.y = -0.6; youth6.userData.head.rotation.y = op * -0.6;
  if (t < 3.6) tBase.userData.pop((t - 0.3) / 0.35); else tUmb.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.2, 0.2, u), lerp(2.0, 1.9, u), lerp(2.6, 1.9, u), DX + 0.3, 1.6, -3.6, 64);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（警察署の前に戻る）
  shotStation(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotStation(t, 0) },
  { a: 9, b: 17, f: shotYard },
  { a: 17, b: 25, f: shotStreet },
  { a: 25, b: 33, f: shotTrain },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotFitting },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '警察に捕まった若者が、<br>なぜか、すぐに釈放。'],
  [5.6, 9.0, 'もらったメダルの番号に、<br>電話しただけなのに。'],
  [9.2, 13.2, '主人公は、<br>くすぶっている若者。'],
  [13.2, 17.0, '能力はあるのに、<br>活かせていない。'],
  [17.2, 21.0, '外で待っていたのは、<br>スーツの紳士。'],
  [21.0, 25.0, '高級な仕立て屋に、<br>来るよう告げられる。'],
  [25.2, 29.0, '紳士は、<br>亡き父の古い知り合い。'],
  [29.0, 33.0, '若者は候補生として、<br>過酷な試験に挑む。'],
  [33.2, 37.4, '2015年に日本で公開。<br>スパイアクション映画。'],
  [37.4, 41.8, 'ロンドンが舞台。<br>出演はコリン・ファース。'],
  [42.2, 45.4, '仕立て屋の地下は、<br>スパイ組織の本部。'],
  [45.4, 49.0, '紳士の武器は、<br>スーツと傘。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>キングスマン。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q106', v2: true, answer: 'キングスマン',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 10610,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '警察': 'けいさつ', '捕まった': 'つかまった', '若者': 'わかもの', '釈放': 'しゃくほう', '番号': 'ばんごう', '電話': 'でんわ', '主人公': 'しゅじんこう', '能力': 'のうりょく', '活かせて': 'いかせて', '外': 'そと', '待って': 'まって', '紳士': 'しんし', '高級': 'こうきゅう', '仕立て屋': 'したてや', '来る': 'くる', '告げられる': 'つげられる', '亡き父': 'なきちち', '古い': 'ふるい', '知り合い': 'しりあい', '候補生': 'こうほせい', '過酷': 'かこく', '試験': 'しけん', '挑む': 'いどむ', '2015年': 'にせんじゅうごねん', '日本': 'にほん', '公開': 'こうかい', '映画': 'えいが', '舞台': 'ぶたい', '出演': 'しゅつえん', '地下': 'ちか', '組織': 'そしき', '本部': 'ほんぶ', '武器': 'ぶき', '傘': 'かさ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n警察に捕まった若者が、なぜか、すぐに釈放。もらったメダルの番号に、電話しただけなのに。主人公は、くすぶっている若者。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'ディズニープラス', '映画好き', '洋画'],
  },
});
applyQuizCards({ answer: 'キングスマン', info: 'Prime Video・Disney+｜映画・129分', answerSize: 128 });
