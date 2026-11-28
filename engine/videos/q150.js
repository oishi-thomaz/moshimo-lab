import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #150 ガーディアンズ・オブ・ギャラクシー（映画・アメリカ・2014年製作・121分。Disney+ で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/gadeianzuobugiyarakushi（サブスクリプション：Disney Plus）と
//   Filmarks の動画配信欄（ディズニープラス 見放題。2026年10月更新）で2026/11/28確認。Filmarks 4.0・レビュー157,725件 filmarks.com/movies/55672）
// 確かめた事実（2026/11/28）：
//   ・映画.com eiga.com/movie/77789 ：2014年製作／121分／アメリカ。全員が犯罪歴をもつお尋ね者たちがチームを組み、銀河滅亡の危機を阻止する戦いに
//     巻き込まれていく姿を描いたマーベルコミックの映画化作。トレジャーハンターの主人公は、ある日、廃墟で謎の球体を見つけ、盗み出すことに成功する。
//     しかし、それは銀河を滅亡させるほどの力を宿したパワーストーンで、狙う者たちに追われ、凶悪犯だけが収容される銀河一危険な収容所に入れられて
//     しまった主人公は、そこで一緒になった4人と協力して脱獄。たまたま利害関係が一致しただけで信頼関係もない5人は、内輪もめを繰り返しながら逃亡を続ける
//   ・Filmarks のあらすじ：幼くして地球から誘拐され、宇宙をまたにかけるトレジャー・ハンターとなった主人公。ハイテク武器と一緒に肌身離さず持っているのは、
//     亡き母の形見の70年代ヒット曲入りウォークマン。賞金稼ぎのアライグマとその相棒の樹木型ヒューマノイド、復讐を誓う男、暗殺者たちと出会う
// 構成（ヒント6段）：1 夜の野原に空からまぶしい光・少年がどこかへ連れ去られる → 2 主人公は宇宙をまたにかけるトレジャーハンター・ある日、光る玉を盗み出す
//   → 3 その玉には星をほろぼすほどの力・あやしい者たちに追われる身に → 4 宇宙一危険な収容所へ・そこで、はみ出し者たちと手を組む
//   → 5 2014年のアメリカ映画・原作はマーベルのコミック → 6 決め手：仲間はしゃべるアライグマと木の人・持ち歩くのは母の形見の70年代ヒット曲
// 結末（戦いの行方）は言わない。登場人物の名前・チーム名・星の名前は出さない。俳優の顔・ポスター・ロゴ・マスクは使わない。
// 有名な場面の構図（廃墟でヘッドホンをして踊りながら歩く冒頭・病院の場面など）はなぞらない。人と生き物は汎用の3D
const S = quizStage({ bg: '#0c1024', floor: null, fogNear: 40, fogFar: 160 });
const qs = S.scene;
const R = rng(15010);

const HERO = { skin: '#f1c9a5', hair: '#6a4426', shirt: '#7a2a1e', pants: '#2a2a30' };
const KID = { skin: '#f4d3b5', hair: '#6a4426', shirt: '#4a6a9a', pants: '#3a4a6a', scale: 0.72 };
const GUARD = { skin: '#8aa0b0', hair: '#1a1e24', shirt: '#2e3644', pants: '#1e242e', bald: true };
const GREEN = { skin: '#5aa06a', hair: '#1a1a1a', shirt: '#1a1a20', pants: '#1a1a20', long: true };
const BIG = { skin: '#8a9aa8', hair: '#8a9aa8', shirt: '#8a9aa8', pants: '#3a2a20', bald: true, scale: 1.2 };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
function stars(cx, n = 500, r = 70) { const g = new THREE.BufferGeometry(); const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const th = R() * Math.PI * 2, ph = R() * Math.PI * 0.9; a[i * 3] = cx + Math.cos(th) * Math.sin(ph) * r; a[i * 3 + 1] = Math.cos(ph) * r * 0.8 + 6; a[i * 3 + 2] = -10 + Math.sin(th) * Math.sin(ph) * r; }
  g.setAttribute('position', new THREE.BufferAttribute(a, 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false })); qs.add(p); return p; }
function orb(c = '#b070ff') { const g = new THREE.Group(); const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), new THREE.MeshStandardMaterial({ color: '#d8c8ff', emissive: c, emissiveIntensity: 1.4, metalness: 0.6, roughness: 0.2 })); g.add(core);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), gl(c, 0.25)); g.add(halo); const lt = new THREE.PointLight(c, 2.5, 4); g.add(lt); g.userData = { halo, lt }; return g; }
function ship(c = '#c8862a') { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: c, metalness: 0.5, roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.4, 8), m); body.rotation.x = -Math.PI / 2; g.add(body);
  for (const s of [-1, 1]) { const w = box(1.3, 0.08, 0.7, m); w.position.set(s * 0.8, 0, 0.4); w.rotation.z = s * 0.15; g.add(w); const en = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), gl('#7ad8ff')); en.position.set(s * 0.5, 0, 1.05); g.add(en); }
  const cp = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), new THREE.MeshStandardMaterial({ color: '#203040', metalness: 0.9, roughness: 0.1 })); cp.position.set(0, 0.2, -0.2); cp.scale.set(1, 0.6, 1.6); g.add(cp); return g; }
function raccoon() { const g = new THREE.Group(); const fur = mat('#8a7460'), dark = mat('#2a2420'), wh = mat('#e8e0d4');
  const body = box(0.36, 0.5, 0.26, mat('#3a4a5a')); body.position.y = 0.55; g.add(body);
  const head = new THREE.Group(); head.position.y = 0.95; g.add(head);
  const hd = box(0.36, 0.3, 0.3, fur); head.add(hd); const mask = box(0.37, 0.1, 0.02, dark); mask.position.set(0, 0.03, 0.155); head.add(mask);
  for (const s of [-1, 1]) { const e = box(0.05, 0.05, 0.02, wh); e.position.set(s * 0.08, 0.03, 0.168); head.add(e); const ear = box(0.08, 0.12, 0.05, fur); ear.position.set(s * 0.13, 0.2, 0); head.add(ear); }
  const nose = box(0.12, 0.1, 0.12, wh); nose.position.set(0, -0.06, 0.18); head.add(nose); const nt = box(0.05, 0.04, 0.03, dark); nt.position.set(0, -0.03, 0.25); head.add(nt);
  for (const s of [-1, 1]) { const l = box(0.12, 0.32, 0.14, mat('#3a4a5a')); l.position.set(s * 0.1, 0.16, 0); g.add(l); const a = box(0.09, 0.32, 0.1, fur); a.position.set(s * 0.24, 0.6, 0.02); g.add(a); }
  const tail = new THREE.Group(); tail.position.set(0, 0.35, -0.15); g.add(tail);
  for (let i = 0; i < 4; i++) { const t = box(0.14, 0.14, 0.16, i % 2 ? dark : fur); t.position.set(0, -0.05 * i, -0.15 * i); tail.add(t); }
  g.userData = { head, tail }; return g; }
function treeMan() { const g = new THREE.Group(); const bark = mat('#6a4a2a'), bark2 = mat('#5a3e22');
  const body = box(0.42, 1.1, 0.3, bark); body.position.y = 1.55; g.add(body);
  for (const s of [-1, 1]) { const l = box(0.16, 1.0, 0.18, bark2); l.position.set(s * 0.12, 0.5, 0); g.add(l); const a = new THREE.Group(); a.position.set(s * 0.3, 2.0, 0); const ar = box(0.12, 1.0, 0.14, bark2); ar.position.y = -0.5; a.add(ar); g.add(a); (g.userData.arms ||= []).push(a); }
  const head = box(0.4, 0.42, 0.36, bark); head.position.y = 2.32; g.add(head);
  for (const s of [-1, 1]) { const e = box(0.06, 0.06, 0.02, mat('#1a1208')); e.position.set(s * 0.09, 2.36, 0.185); g.add(e); }
  for (let i = 0; i < 5; i++) { const b = box(0.05, 0.3, 0.05, bark2); b.position.set(-0.16 + i * 0.08, 2.62, -0.05); b.rotation.z = (i - 2) * 0.25; g.add(b); }
  const lf = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat('#6ab04a')); lf.position.set(0.22, 1.9, 0.12); g.add(lf);
  return g; }
function tape() { const g = new THREE.Group(); const b = box(0.5, 0.3, 0.12, mat('#d8d0c0')); g.add(b); const w = box(0.3, 0.12, 0.02, mat('#2a2a2a')); w.position.set(0, 0.03, 0.065); g.add(w);
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12), mat('#f0f0f0')); r.rotation.x = Math.PI / 2; r.position.set(s * 0.08, 0.03, 0.07); g.add(r); }
  const ph = new THREE.Group(); const band = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 6, 20, Math.PI), mat('#3a3a3a')); band.position.y = 0.3; ph.add(band);
  for (const s of [-1, 1]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 14), mat('#c84a2a')); cup.rotation.z = Math.PI / 2; cup.position.set(s * 0.22, 0.3, 0); ph.add(cup); }
  ph.position.set(0, 0.05, -0.05); g.add(ph); return g; }

// ---------- 1段目. 夜の野原（x=0）。遠くに一軒家の灯り、空からまぶしい光の柱、見上げる少年 ----------
stars(0, 300, 80);
{ const gr = box(40, 0.1, 40, mat('#1e2a1a')); gr.position.set(0, -0.05, -8); qs.add(gr);
  const hs = box(2.6, 1.8, 2.2, mat('#3a3028')); hs.position.set(-6, 0.9, -14); qs.add(hs); const rf = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.2, 4), mat('#2a1e18')); rf.position.set(-6, 2.4, -14); rf.rotation.y = Math.PI / 4; qs.add(rf);
  const wn = box(0.5, 0.4, 0.02, gl('#ffd890')); wn.position.set(-5.3, 1.0, -12.88); qs.add(wn);
  for (let i = 0; i < 14; i++) { const gs = box(0.05, 0.3 + R() * 0.3, 0.05, mat('#2e3e24')); gs.position.set(-3 + R() * 6, 0.15, -2 - R() * 6); qs.add(gs); } }
const KID1 = person(KID, 0.2, -3.4, 0.3);
const BEAM1 = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 2.2, 14, 24, 1, true), gl('#d8f0ff', 0.22)); BEAM1.position.set(0.2, 7, -3.6); qs.add(BEAM1);
const GLOW1 = new THREE.Mesh(new THREE.CircleGeometry(2.0, 32), gl('#e8f8ff', 0.4)); GLOW1.rotation.x = -Math.PI / 2; GLOW1.position.set(0.2, 0.02, -3.6); qs.add(GLOW1);
const L1 = new THREE.PointLight('#d8f0ff', 0, 10); L1.position.set(0.2, 3.5, -3.0); qs.add(L1);
const SHIP1 = ship('#5a5a6a'); SHIP1.scale.setScalar(3.2); SHIP1.rotation.x = Math.PI / 2; SHIP1.position.set(0.2, 14, -3.6); qs.add(SHIP1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tLight = tag('夜の野原に、空からまぶしい光', { size: 46, w: 860, bg: '#14161c', sx: 1.95 }); qs.add(tLight);
const tTaken = tag('少年が、どこかへ連れ去られる', { size: 48, w: 820, bg: '#e24050', sx: 1.85 }); qs.add(tTaken);

// ---------- 2段目. 宇宙の廃墟（x=50）。岩の大地と崩れた柱、ヘルメット姿の男が台座から光る玉を取る ----------
const AX = 50;
stars(AX, 400, 80);
{ const gr = box(30, 0.2, 30, mat('#3a3440')); gr.position.set(AX, -0.1, -6); qs.add(gr);
  for (let i = 0; i < 6; i++) { const h = 1.5 + R() * 2.5; const c = box(0.6, h, 0.6, mat('#5a5462')); c.position.set(AX - 5 + i * 2, h / 2, -7 - (i % 2) * 2); c.rotation.z = (R() - 0.5) * 0.2; qs.add(c); }
  for (let i = 0; i < 10; i++) { const r = box(0.3 + R() * 0.6, 0.3 + R() * 0.5, 0.3 + R() * 0.6, mat('#4a4452')); r.position.set(AX - 5 + R() * 10, 0.15, -1 - R() * 9); r.rotation.y = R() * 3; qs.add(r); }
  const pl = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 20), new THREE.MeshBasicMaterial({ color: '#7a5aa0', fog: false })); pl.position.set(AX + 18, 14, -60); qs.add(pl);
  const lt = new THREE.PointLight('#b8a8ff', 1.6, 18); lt.position.set(AX, 4, -2); qs.add(lt); }
const PED2 = box(0.7, 1.0, 0.7, mat('#6a6070')); PED2.position.set(AX, 0.5, -4.2); qs.add(PED2);
const ORB2 = orb(); ORB2.position.set(AX, 1.25, -4.2); qs.add(ORB2);
const HERO2 = person(HERO, AX - 1.4, -3.2, 1.2);
const HELM2 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), new THREE.MeshStandardMaterial({ color: '#3a3a44', metalness: 0.7, roughness: 0.3 })); HELM2.position.y = 0.24; HELM2.scale.set(1, 1.05, 1); HERO2.userData.head.add(HELM2);
const VIS2 = box(0.36, 0.1, 0.06, gl('#e84040')); VIS2.position.set(0, 0.27, 0.25); HERO2.userData.head.add(VIS2);
const tHunt = tag('主人公は、宇宙をまたにかけるトレジャーハンター', { size: 40, w: 980, bg: '#14161c', sx: 2.1 }); qs.add(tHunt);
const tSteal = tag('ある日、光る玉を盗み出す', { size: 52, w: 720, bg: '#e24050', sx: 1.75 }); qs.add(tSteal);

// ---------- 3段目. 宇宙空間（x=100）。玉を積んだ小さな船を、黒い船の群れが追ってくる ----------
const BX = 100;
stars(BX, 700, 60);
const SHIP3 = ship(); SHIP3.position.set(BX, 2.4, -6); qs.add(SHIP3);
const ORB3 = orb(); ORB3.scale.setScalar(0.6); ORB3.position.set(0, 0.3, 0); SHIP3.add(ORB3);
const ENEMY3 = [0, 1, 2, 3].map(i => { const s = ship('#2a2a30'); s.position.set(BX - 2 + i * 1.4, 2 + (i % 2) * 1.2, 6 + i * 2.5); qs.add(s); return s; });
const PLAN3 = new THREE.Mesh(new THREE.SphereGeometry(18, 40, 24), new THREE.MeshStandardMaterial({ color: '#2a5a8a', emissive: '#0a1a30' })); PLAN3.position.set(BX - 10, -22, -40); qs.add(PLAN3);
const LASER3 = [0, 1, 2].map(() => { const l = box(0.04, 0.04, 1.6, gl('#ff4040')); qs.add(l); return l; });
const tPower = tag('その玉には、星をほろぼすほどの力', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tPower);
const tChase = tag('あやしい者たちに、追われる身に', { size: 48, w: 820, bg: '#e24050', sx: 1.85 }); qs.add(tChase);

// ---------- 4段目. 宇宙の収容所（x=150）。黄色い囚人服の5人、それぞれ違う見た目、看守の目 ----------
const CX = 150;
{ const fl = box(16, 0.1, 14, mat('#3a3e46')); fl.position.set(CX, -0.05, -4); qs.add(fl);
  const wl = box(16, 8, 0.3, mat('#2a2e36')); wl.position.set(CX, 4, -10); qs.add(wl);
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) { const cell = box(2.4, 1.6, 0.1, gl('#ffd070', 0.5)); cell.position.set(CX - 5.4 + i * 3.6, 1.2 + k * 2.2, -9.8); qs.add(cell); const bar = box(2.4, 0.08, 0.12, mat('#5a5e66')); bar.position.set(CX - 5.4 + i * 3.6, 0.4 + k * 2.2 + 1.6, -9.7); qs.add(bar); }
  const tw = box(1.4, 6, 1.4, mat('#4a4e56')); tw.position.set(CX + 5, 3, -6); qs.add(tw); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), gl('#ff3030')); eye.position.set(CX + 5, 5.4, -5.3); qs.add(eye);
  const lt = new THREE.PointLight('#ffe0a0', 2.2, 16); lt.position.set(CX, 5, -2); qs.add(lt); }
const PRIS = { shirt: '#e8b020', pants: '#e8b020' };
const HERO4 = person({ ...HERO, ...PRIS }, CX - 1.6, -3.6, 0.3);
const GREEN4 = person({ ...GREEN, ...PRIS }, CX - 0.4, -4.4, 0.1);
const BIG4 = person({ ...BIG, ...PRIS }, CX + 1.0, -4.6, -0.2);
const RAC4 = raccoon(); RAC4.position.set(CX + 0.4, 0, -2.8); RAC4.rotation.y = -0.3; qs.add(RAC4);
const TREE4 = treeMan(); TREE4.position.set(CX + 2.3, 0, -4.0); TREE4.rotation.y = -0.4; qs.add(TREE4);
const GUARD4 = person(GUARD, CX - 4.2, -6.4, 0.6);
const tJail = tag('つかまって、宇宙一危険な収容所へ', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tJail);
const tTeam = tag('そこで、はみ出し者たちと手を組む', { size: 44, w: 900, bg: '#e24050', sx: 2.0 }); qs.add(tTeam);

// ---------- 5段目. 夜の映画館（x=200）。光るスクリーン、赤い座席、宙に浮かぶ本のページ（コミック） ----------
const DX = 200;
{ const fl = box(14, 0.04, 14, mat('#1a1416')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const st = box(0.55, 0.5, 0.5, mat('#8a1a24')); st.position.set(DX - 2.4 + i * 0.6, 0.35 + r * 0.25, -1 + r * 1.0); qs.add(st); const bk = box(0.55, 0.6, 0.12, mat('#7a1620')); bk.position.set(DX - 2.4 + i * 0.6, 0.85 + r * 0.25, -0.76 + r * 1.0); qs.add(bk); } }
const SCREEN5 = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.2), new THREE.MeshBasicMaterial({ color: '#3a3a6a' })); SCREEN5.position.set(DX, 3.0, -7); qs.add(SCREEN5);
const SST5 = []; for (let i = 0; i < 40; i++) { const s = box(0.04, 0.04, 0.01, gl('#ffffff')); s.position.set(DX - 3.3 + R() * 6.6, 1.5 + R() * 3, -6.98); qs.add(s); SST5.push(s); }
const PAGES5 = []; const PC = ['#e24050', '#3a7ae0', '#e6b450', '#3aa860'];
for (let i = 0; i < 4; i++) { const g = new THREE.Group(); const pg = box(0.9, 1.2, 0.02, mat('#f4f0e6')); g.add(pg);
  for (let k = 0; k < 4; k++) { const pn = box(0.38, 0.5, 0.01, mat(PC[(i + k) % 4])); pn.position.set(-0.2 + (k % 2) * 0.4, 0.27 - Math.floor(k / 2) * 0.54, 0.015); g.add(pn); }
  g.position.set(DX - 1.8 + i * 1.2, 1.9, -3.4); qs.add(g); PAGES5.push(g); }
const t2014 = tag('2014年の、アメリカ映画', { size: 54, w: 680, bg: '#e6b450', color: '#14161c', sx: 1.65 }); qs.add(t2014);
const tMarvel = tag('原作は、マーベルのコミック', { size: 50, w: 760, bg: '#e24050', sx: 1.8 }); qs.add(tMarvel);

// ---------- 6段目. 船の中（x=250）。操縦席の窓に星、アライグマと木の人、手元にカセットのプレーヤー ----------
const EX = 250;
stars(EX, 500, 40);
{ const fl = box(8, 0.1, 6, mat('#4a3a2e')); fl.position.set(EX, -0.05, -2); qs.add(fl);
  const fr = box(8, 0.5, 0.3, mat('#6a4a30')); fr.position.set(EX, 3.6, -5); qs.add(fr); const fb = box(8, 1.0, 0.3, mat('#6a4a30')); fb.position.set(EX, 0.5, -5); qs.add(fb);
  for (const s of [-1, 1]) { const p = box(0.3, 3.6, 0.3, mat('#6a4a30')); p.position.set(EX + s * 2.5, 1.8, -5); qs.add(p); }
  const dash = box(4.6, 0.3, 1.0, mat('#3a2e26')); dash.position.set(EX, 1.1, -4.4); qs.add(dash);
  for (let i = 0; i < 8; i++) { const b = box(0.14, 0.04, 0.14, gl(['#ff6040', '#40e0ff', '#ffd040'][i % 3])); b.position.set(EX - 1.6 + i * 0.45, 1.27, -4.3); qs.add(b); }
  const lt = new THREE.PointLight('#ffb070', 2.4, 10); lt.position.set(EX, 3, -1); qs.add(lt); }
const RAC6 = raccoon(); RAC6.position.set(EX - 0.9, 0, -2.6); RAC6.rotation.y = 0.5; qs.add(RAC6);
const TREE6 = treeMan(); TREE6.position.set(EX + 0.95, 0, -3.2); TREE6.rotation.y = -0.4; qs.add(TREE6);
const TAPE6 = tape(); TAPE6.position.set(EX + 0.1, 1.45, -4.2); TAPE6.rotation.x = -0.2; qs.add(TAPE6);
const NOTES6 = []; for (let i = 0; i < 6; i++) { const n = tag('♪', { size: 90, w: 120, h: 120, bg: 'rgba(0,0,0,0)', color: '#e6b450', sx: 0.4 }); n.renderOrder = 6; qs.add(n); NOTES6.push(n); }
const tPals = tag('仲間は、しゃべるアライグマと木の人', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tPals);
const tSong = tag('母の形見の、70年代ヒット曲', { size: 48, w: 820, bg: '#e6b450', color: '#14161c', sx: 1.85 }); qs.add(tSong);

// ---------- shots ----------
const ALL = [tLight, tTaken, tHunt, tSteal, tPower, tChase, tJail, tTeam, t2014, tMarvel, tPals, tSong, Q1, ...NOTES6];
function base() { S.reset(); ALL.forEach(x => x.visible = false); LASER3.forEach(l => l.visible = false); }

function shotField(t, quiz = 0) { // 1段目 0〜9：夜の野原に、空からまぶしい光。少年が、どこかへ連れ去られる（0秒目がサムネ）
  base(); S.aim(0, -3); lift(300); S.hemi.intensity = 0.7; S.key.intensity = 0.5;
  const k = quiz ? 0.8 : clamp(0.55 + t / 6), up = quiz ? 0 : clamp((t - 5.4) / 3.0);
  BEAM1.material.opacity = 0.12 + 0.18 * k + Math.sin(t * 9) * 0.02; GLOW1.material.opacity = 0.25 + 0.3 * k; L1.intensity = 6 * k;
  SHIP1.position.y = 9.0 - k * 0.8; SHIP1.rotation.z = t * 0.4;
  KID1.position.y = ease(up) * 0.7; KID1.rotation.y = 0.3 + up * 1.5; KID1.userData.head.rotation.x = -0.5;
  KID1.userData.arms.forEach((a, i) => a.rotation.x = -0.3 - up * 2.2); KID1.userData.legs.forEach((l, i) => l.rotation.x = up * (i ? 0.4 : -0.3));
  Q1.position.set(1.5, 2.2, -4.2); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tLight, 0.75); pin(tTaken, 0.75);
  if (!quiz) { tLight.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tLight.visible = false; tTaken.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-1.8, -1.5, u), lerp(0.8, 0.7, u), lerp(2.8, 2.2, u), 0.2, lerp(2.3, 2.4, u), -3.6, 74);
  return qs;
}
function shotRuins(t) { // 2段目 9〜17：主人公は、宇宙をまたにかけるトレジャーハンター。ある日、光る玉を盗み出す
  base(); S.aim(AX, -4); lift(0); S.hemi.intensity = 0.55; S.key.intensity = 0.5; S.darken(0.2, '#06040c');
  const grab = t > 4.3;
  if (!grab) { HERO2.position.set(AX - 1.4 + ease(clamp(t / 3.6)) * 0.75, 0, -3.2 - ease(clamp(t / 3.6)) * 0.4); poseWalk(HERO2, t * 5, t < 3.6 ? 0.6 : 0); }
  HERO2.userData.arms[1].rotation.x = grab ? -1.3 : 0; HERO2.userData.arms[1].rotation.z = grab ? 0.3 : 0;
  if (grab) { const g = clamp((t - 4.3) / 0.8); ORB2.position.set(lerp(AX, HERO2.position.x + 0.25, g), lerp(1.25, 1.55, g), lerp(-4.2, HERO2.position.z - 0.35, g)); } else ORB2.position.set(AX, 1.25 + Math.sin(t * 2) * 0.05, -4.2);
  ORB2.userData.halo.scale.setScalar(1 + Math.sin(t * 5) * 0.15);
  const u = ease(t / 8);
  look(AX + lerp(2.2, 1.8, u), lerp(1.8, 1.7, u), lerp(0.6, 0.0, u), AX - 0.6, 1.1, -3.9, 62);
  pin(tHunt, 1.05); pin(tSteal, 1.05);
  tHunt.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tHunt.visible = false; tSteal.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotChase(t) { // 3段目 17〜25：その玉には、星をほろぼすほどの力。あやしい者たちに、追われる身に
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 0.5; S.key.intensity = 0.9; S.darken(0.3, '#02030a');
  SHIP3.position.set(BX + Math.sin(t * 1.3) * 0.5, 2.4 + Math.sin(t * 2.1) * 0.2, -6 - t * 0.6); SHIP3.rotation.z = Math.sin(t * 1.3) * 0.35;
  ORB3.userData.halo.scale.setScalar(1 + Math.sin(t * 6) * 0.2);
  const ch = clamp((t - 3.6) / 2.0);
  ENEMY3.forEach((s, i) => { s.position.set(BX - 2.2 + i * 1.4 + Math.sin(t + i) * 0.3, 2 + (i % 2) * 1.0, lerp(10 + i * 2.5, -1.5 + i * 1.2, ch) - t * 0.6); s.rotation.z = Math.sin(t * 1.5 + i) * 0.2; });
  LASER3.forEach((l, i) => { const s = ((t * 1.5 + i / 3) % 1); const e = ENEMY3[i]; l.visible = t > 4.6; l.position.set(e.position.x, e.position.y, e.position.z - 2 - s * 6); });
  const u = ease(t / 8);
  look(BX + lerp(2.2, 1.6, u), lerp(3.6, 3.3, u), SHIP3.position.z - lerp(5.0, 4.4, u), BX, 1.5, SHIP3.position.z + 5.0, 62);
  pin(tPower, 1.05); pin(tChase, 1.05);
  tPower.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tPower.visible = false; tChase.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotPrison(t) { // 4段目 25〜33：つかまって、宇宙一危険な収容所へ。そこで、はみ出し者たちと手を組む
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 0.8; S.key.intensity = 0.6; S.darken(0.3, '#0a0a10');
  const join = t > 4.3;
  HERO4.userData.head.rotation.y = join ? 0.5 : Math.sin(t * 0.8) * 0.4; GREEN4.userData.head.rotation.y = join ? -0.3 : 0.2;
  RAC4.userData.head.rotation.y = Math.sin(t * 1.6) * 0.4; RAC4.userData.tail.rotation.y = Math.sin(t * 3) * 0.4;
  if (join) { HERO4.userData.arms[1].rotation.x = -1.4; BIG4.userData.arms[0].rotation.x = -1.4; TREE4.userData.arms[0].rotation.x = -0.8; }
  GUARD4.position.x = CX - 4.2 + Math.sin(t * 0.5) * 0.6; poseWalk(GUARD4, t * 4, 0.5);
  const u = ease(t / 8);
  look(CX + lerp(-0.2, 0.2, u), lerp(2.0, 1.8, u), lerp(3.8, 2.8, u), CX + 0.1, 1.1, -4.0, 64);
  pin(tJail, 1.05); pin(tTeam, 1.05);
  tJail.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tJail.visible = false; tTeam.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTheater(t) { // 5段目 33〜42：2014年の、アメリカ映画。原作は、マーベルのコミック
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.4; S.key.intensity = 0.2; S.darken(0.8, '#020204');
  SST5.forEach((s, i) => s.position.x = DX - 3.3 + ((i * 0.37 + t * 0.3) % 6.6));
  PAGES5.forEach((g, i) => { g.visible = t > 4.3 + i * 0.2; g.rotation.y = Math.sin(t * 1.2 + i) * 0.4; g.position.y = 1.9 + Math.sin(t * 1.6 + i) * 0.1; });
  const u = ease(t / 9);
  look(DX + lerp(-0.4, 0.4, u), lerp(2.4, 2.3, u), lerp(2.4, 1.6, u), DX, 1.8, -4.5, 62);
  pin(t2014, 1.05); pin(tMarvel, 1.05);
  t2014.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2014.visible = false; tMarvel.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotCockpit(t) { // 6段目 42〜49（決め手）：仲間は、しゃべるアライグマと木の人。持ち歩くのは、母の形見の70年代ヒット曲
  base(); S.aim(EX, -3); lift(0); S.hemi.intensity = 0.7; S.key.intensity = 0.5; S.darken(0.5, '#04040a');
  RAC6.userData.head.rotation.y = -0.4 + Math.sin(t * 2) * 0.3; RAC6.userData.tail.rotation.y = Math.sin(t * 4) * 0.5;
  TREE6.userData.arms[0].rotation.x = -0.3 + Math.sin(t * 2.4) * 0.2; TREE6.rotation.y = -0.4 + Math.sin(t * 1.2) * 0.1;
  const song = t > 3.6;
  NOTES6.forEach((n, i) => { const s = ((t * 0.5 + i / 6) % 1); n.visible = song; n.position.set(EX + 0.1 + Math.sin(i * 2.1 + t) * 0.6, 1.7 + s * 1.4, -4.1 + Math.cos(i) * 0.2); n.material.opacity = 1 - s; });
  const u = ease(t / 7);
  if (!song) look(EX + lerp(0.1, 0.2, u), lerp(1.7, 1.6, u), lerp(2.6, 2.0, u), EX + 0.15, 1.1, -3.0, 62);
  else { const v = ease(clamp((t - 3.6) / 1.2)); look(EX + lerp(0.0, 0.3, v), lerp(1.8, 2.0, v), lerp(1.0, -2.2, v), EX + 0.1, lerp(1.2, 1.5, v), -4.2, 62); }
  pin(tPals, 1.05); pin(tSong, 1.05);
  if (t < 3.6) tPals.userData.pop((t - 0.3) / 0.35); else tSong.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（夜の野原に戻る）
  shotField(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotField(t, 0) },
  { a: 9, b: 17, f: shotRuins },
  { a: 17, b: 25, f: shotChase },
  { a: 25, b: 33, f: shotPrison },
  { a: 33, b: 42, f: shotTheater },
  { a: 42, b: 49, f: shotCockpit },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '夜の野原に、<br>空からまぶしい光。'],
  [5.6, 9.0, '少年が、どこかへ<br>連れ去られる。'],
  [9.2, 13.2, '主人公は、宇宙をまたにかける<br>トレジャーハンター。'],
  [13.2, 17.0, 'ある日、光る玉を<br>盗み出す。'],
  [17.2, 21.0, 'その玉には、星を<br>ほろぼすほどの力。'],
  [21.0, 25.0, 'あやしい者たちに、<br>追われる身に。'],
  [25.2, 29.0, 'つかまって、宇宙一<br>危険な収容所へ。'],
  [29.0, 33.0, 'そこで、はみ出し者たちと<br>手を組む。'],
  [33.2, 37.4, '2014年の、<br>アメリカ映画。'],
  [37.4, 41.8, '原作は、<br>マーベルのコミック。'],
  [42.2, 45.4, '仲間は、しゃべる<br>アライグマと木の人。'],
  [45.4, 49.0, '持ち歩くのは、母の形見の<br>70年代ヒット曲。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、ガーディアンズ・<br>オブ・ギャラクシー。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q150', v2: true, answer: 'ガーディアンズ・オブ・ギャラクシー',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 15010,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'whoosh'], [9.0, 'whoosh'], [13.2, 'bubble'], [17.0, 'whoosh'], [21.0, 'whoosh'], [25.0, 'whoosh'], [29.0, 'bubble'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ガーディアンズ・オブ・ギャラクシー': 'ガーディアンズオブギャラクシー', 'トレジャーハンター': 'トレジャーハンター', 'アメリカ映画': 'アメリカえいが', '70年代': 'ななじゅうねんだい', '2014年': 'にせんじゅうよねん', '連れ去られる': 'つれさられる', '盗み出す': 'ぬすみだす', '追われる身': 'おわれるみ', '宇宙一': 'うちゅういち', '収容所': 'しゅうようじょ', 'はみ出し者': 'はみだしもの', '手を組む': 'てをくむ', '持ち歩く': 'もちあるく', 'ヒット曲': 'ヒットきょく', '主人公': 'しゅじんこう', '聞かせて': 'きかせて', '当てて': 'あてて', '野原': 'のはら', '夜': 'よる', '空': 'そら', '光る玉': 'ひかるたま', '光': 'ひかり', '少年': 'しょうねん', '宇宙': 'うちゅう', '玉': 'たま', '星': 'ほし', '力': 'ちから', '危険': 'きけん', '原作': 'げんさく', '仲間': 'なかま', '木の人': 'きのひと', '母': 'はは', '形見': 'かたみ', '間に': 'あいだに', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', 'ある日': 'あるひ' },
    caption: 'この映画のタイトル、わかる？\n夜の野原に、空からまぶしい光。少年が、どこかへ連れ去られる。主人公は、宇宙をまたにかけるトレジャーハンター。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'ディズニープラス', '映画好き', '洋画', 'マーベル'],
  },
});
applyQuizCards({ answer: 'ガーディアンズ・<br>オブ・ギャラクシー', info: 'Disney+｜映画・121分', answerSize: 84 });
