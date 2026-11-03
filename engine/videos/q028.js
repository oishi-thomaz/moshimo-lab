import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, easeBack, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #028 トッケビ～君がくれた愛しい日々～（ドラマ・韓国・2016年・ファンタジー/恋愛。Prime Video・Disney+・Netflixで見放題、
//   justwatch.com/jp/テレビ番組/totsukebi で2026/11/3確認。Filmarks 4.4・レビュー55,307件 filmarks.com/dramas/946/2084）
// 確かめた事実：
//   ・高麗時代、逆賊の汚名を着せられ処刑された武臣キム・シンは、神の力によって「トッケビ」となる。不滅の命を解き放てるのは「トッケビの花嫁」だけ。
//     900年後の現代、自分をトッケビの花嫁だと主張するウンタクと出会う。「太陽の末裔」の監督と脚本家が組んだ大ヒット作。死神と同居する（ciatr.jp/topics/308254）
//   ・約900年後のある日、シンは女子高校生のウンタクと出会う（thetv.jp/program/0000941121/）。不滅の命から解放されたいシンは、花嫁のウンタクに胸の剣を抜いてほしいと打ち明ける。
//     同居する死神は記憶喪失（thetv.jp/program/0000987996/plot/）。ウンタクは幽霊に頼まれて幽霊の元夫に会いに行く（thetv.jp/program/0000941121/plot/）
//   ・Filmarks の作品紹介：かつて武臣の将軍だったキム・シンが、ある悲劇的な出来事によって鬼神「トッケビ」へと変貌。自分を「鬼神の花嫁」だと名乗るウンタクと出会う
// 構成（ヒント6段）：1 見知らぬ女子高生が わたしはあなたの花嫁です → 2 およそ900年、死ねずに生きてきた男 → 3 昔の王国から今の都会へ、少女には幽霊が見える
//   → 4 大きな家の同居人は、記憶をなくした死神 → 5 韓国の大ヒット・ファンタジーラブ、太陽の末裔の監督と脚本家 → 6 決め手：男の胸には剣、抜けるのは花嫁だけ
// 剣を抜くとどうなるか・前世の因縁・結末には一切触れない。俳優の見た目・衣装（死神の帽子など）・ポスター・ロゴ・有名な場面（海辺・カナダ）は使わない。血・けがの描写なし

const S = quizStage({ bg: '#141a2c', floor: '#1e2436', fogNear: 22, fogFar: 72 });
const qs = S.scene;
const R = rng(2828);

const GIRL = { skin: '#f1cfb0', hair: '#1d1716', shirt: '#2a3858', pants: '#5a3a3a', long: true, skirt: true };
const MAN = { skin: '#efcfae', hair: '#1a1616', shirt: '#2a2a30', pants: '#1c1c22' };
const REAPER = { skin: '#f2e4d8', hair: '#121212', shirt: '#101014', pants: '#0c0c10', tie: true };
function walk(p, ph, k = 1) { p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.3 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.3 * k; }
// 長いコート（男）。体の後ろに足して、すそを少し広げる
function coat(p, c = '#7a6250') { const g = new THREE.Group(); const b = box(0.56, 0.95, 0.32, mat(c)); b.position.y = 0.98; g.add(b); for (const s of [-1, 1]) { const f = box(0.26, 0.5, 0.06, mat(c)); f.position.set(s * 0.14, 0.62, 0.16); g.add(f); } p.add(g); return p; }
// 学校のリボン
function ribbon(p) { const r = box(0.16, 0.08, 0.03, mat('#c8343a')); r.position.set(0, 1.4, 0.16); p.add(r); return p; }
// 胸の剣（6段目）：半透明に光る剣。血やけがは描かない
function makeSword() {
  const g = new THREE.Group();
  const bladeM = new THREE.MeshBasicMaterial({ color: '#bfe4ff', transparent: true, opacity: 0.85, depthWrite: false });
  const blade = box(0.09, 0.8, 0.03, bladeM); blade.position.y = 0.04; g.add(blade);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 4), bladeM); tip.position.y = -0.44; tip.rotation.z = Math.PI; g.add(tip);
  const guard = box(0.32, 0.06, 0.08, new THREE.MeshBasicMaterial({ color: '#e6c870', transparent: true, opacity: 0.9 })); guard.position.y = 0.44; g.add(guard);
  const grip = box(0.08, 0.42, 0.08, new THREE.MeshBasicMaterial({ color: '#8a6a3a', transparent: true, opacity: 0.9 })); grip.position.y = 0.67; g.add(grip);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshBasicMaterial({ color: '#9ad8ff', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending })); glow.position.y = 0.0; glow.visible = false; g.add(glow);
  g.userData.mats = [bladeM, guard.material, grip.material, glow.material]; g.userData.base = [0.85, 0.9, 0.9, 0.22];
  g.rotation.x = 0.85; g.rotation.z = 0.1; g.scale.setScalar(1.3);
  return g;
}
function showSword(sw, k) { sw.visible = k > 0.001; sw.userData.mats.forEach((m, i) => { m.opacity = sw.userData.base[i] * clamp(k); }); }

// ---------- 1段目. 夜の路地（x=0）。見知らぬ女子高生が「わたしはあなたの花嫁です」 ----------
{ const road = box(14, 0.04, 12, mat('#262a34')); road.position.set(0, 0.02, -1); qs.add(road);
  for (let i = 0; i < 5; i++) { const w = 2.6 + R() * 1.0, h = 5 + R() * 4; const wt = windowTextures(2800 + i, '#2e3446'); wt.map.repeat.set(w / 2, h / 2.5); wt.emi.repeat.set(w / 2, h / 2.5); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.5), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffd890'), emissiveIntensity: 0.5 })); b.position.set(-5.4 + i * 2.7, h / 2, -5.4 - (i % 2)); qs.add(b); }
  const pole = box(0.12, 3.6, 0.12, mat('#3a3c44')); pole.position.set(1.7, 1.8, -1.2); qs.add(pole);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe2a0' })); bulb.position.set(1.4, 3.5, -1.2); qs.add(bulb); }
const LAMP1 = new THREE.SpotLight(0xffe0a8, 0, 12, 0.7, 0.5, 0.9); LAMP1.position.set(1.4, 3.5, -1.0); LAMP1.target.position.set(0, 0, 0.3); qs.add(LAMP1); qs.add(LAMP1.target);
const girl1 = ribbon(makePerson(GIRL)); girl1.position.set(-0.75, 0, 0.4); girl1.rotation.y = 0.9; qs.add(girl1);
const man1 = coat(makePerson(MAN)); man1.scale.setScalar(1.12); man1.position.set(0.75, 0, 0.1); man1.rotation.y = -0.9; qs.add(man1);
const tBride = tag('あなたの花嫁です', { size: 66, w: 600, bg: '#e2483c', sx: 1.5 }); tBride.position.set(-0.15, 2.3, 0.5); qs.add(tBride);
const tWho = tag('？', { size: 110, w: 170, h: 170, bg: '#14161c', sx: 0.5 }); tWho.position.set(0.95, 2.45, 0.2); qs.add(tWho);

// ---------- 2段目. 季節がめぐっても、ひとり変わらない男（x=30） ----------
const MX = 30;
{ const st = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), mat('#2a2f40')); st.rotation.x = -Math.PI / 2; st.position.set(MX, 0.03, 0); qs.add(st); }
const man2 = coat(makePerson(MAN)); man2.scale.setScalar(1.12); man2.position.set(MX, 0, 0); qs.add(man2);
const TREE = new THREE.Group(); TREE.position.set(MX - 2.2, 0, -1.6); qs.add(TREE);
{ const tr = box(0.3, 2.4, 0.3, mat('#4a3426')); tr.position.y = 1.2; TREE.add(tr); }
const LEAF_M = new THREE.MeshLambertMaterial({ color: '#f2b8c8' });
const CROWN = new THREE.Mesh(new THREE.SphereGeometry(1.2, 14, 10), LEAF_M); CROWN.position.y = 2.9; CROWN.scale.set(1, 0.8, 1); TREE.add(CROWN);
const SEASON = ['#f2b8c8', '#4f9a4a', '#d8742a', '#eef2f6'];
const SEASON_BG = ['#3a3048', '#1e3a34', '#3a2a1e', '#2a3446'];
const FALL = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.09), new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide })); m.userData.x = MX - 4 + R() * 8; m.userData.z = -2.5 + R() * 4; m.userData.s = 0.5 + R() * 0.7; m.userData.o = R() * 10; qs.add(m); FALL.push(m); }
const HOUR = new THREE.Group(); HOUR.position.set(MX + 0.95, 0, 0.3); qs.add(HOUR);
{ const gm = new THREE.MeshLambertMaterial({ color: '#cfe6ff', transparent: true, opacity: 0.35 }); const a = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.55, 20), gm); a.position.y = 0.95; a.rotation.z = Math.PI; HOUR.add(a); const b = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.55, 20), gm); b.position.y = 0.4; HOUR.add(b);
  for (const y of [0.1, 1.25]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.07, 20), mat('#6a4a2a')); c.position.y = y; HOUR.add(c); } }
const SAND = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), new THREE.MeshBasicMaterial({ color: '#e6c870' })); SAND.position.set(0, 0.62, 0); HOUR.add(SAND);
const SANDPILE = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.2, 20), mat('#e6c870')); HOUR.add(SANDPILE);
const t900 = tag('およそ900年', { size: 74, w: 500, bg: '#14161c', sx: 1.5 }); t900.position.set(MX, 2.75, 0.3); qs.add(t900);
const tForever = tag('死ねない男', { size: 78, w: 460, bg: '#e2483c', sx: 1.5 }); tForever.position.set(MX, 2.75, 0.3); qs.add(tForever);

// ---------- 3段目. 昔の王国の門から、今の大都会へ。少女には見えないものが見える（x=60） ----------
const SX = 60;
const GATE = new THREE.Group(); GATE.position.set(SX - 6.5, 0, -2.5); qs.add(GATE);
{ const red = mat('#9a3a2e'), roofM = mat('#2e3a3a'), stone = mat('#8a8478');
  const base0 = box(6, 1.4, 1.6, stone); base0.position.y = 0.7; GATE.add(base0);
  for (const x of [-2.2, -0.8, 0.8, 2.2]) { const c = box(0.3, 2.0, 0.3, red); c.position.set(x, 2.4, 0); GATE.add(c); }
  const beam = box(5.6, 0.3, 1.2, mat('#3a6a5a')); beam.position.y = 3.5; GATE.add(beam);
  const roof = box(7.0, 0.35, 2.4, roofM); roof.position.y = 3.85; GATE.add(roof);
  const roof2 = box(5.2, 0.5, 1.8, roofM); roof2.position.y = 4.2; GATE.add(roof2);
  for (const s of [-1, 1]) { const tip = box(0.9, 0.2, 2.4, roofM); tip.position.set(s * 3.6, 4.0, 0); tip.rotation.z = s * 0.35; GATE.add(tip); } }
const MODERN = [];
for (let i = 0; i < 6; i++) { const w = 2.2 + R() * 1.2, h = 7 + R() * 9; const wt = windowTextures(2850 + i, ['#4a5a78', '#5a6478', '#3e4a62'][i % 3]); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.4), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffe2a8'), emissiveIntensity: 0.6 })); b.position.set(SX + 0.5 + i * 2.9, h / 2, -7 - (i % 2) * 1.6); qs.add(b); MODERN.push(b); }
{ const sw = box(20, 0.05, 4, mat('#5a5e68')); sw.position.set(SX + 2, 0.03, 0); qs.add(sw); }
const girl3 = ribbon(makePerson(GIRL)); girl3.position.set(SX + 2, 0, 0.6); qs.add(girl3);
const PASS = [0, 1, 2, 3].map(i => { const p = makePerson({ skin: '#ecc9a6', hair: ['#2a2420', '#4a3a2a', '#1a1a1a', '#6a5a4a'][i], shirt: ['#5a6a8a', '#8a5a4a', '#4a6a5a', '#6a5a7a'][i], pants: '#2b3346' }); p.userData.x0 = SX - 2 + i * 2.2; p.userData.z = i % 2 ? -1.0 : -1.9; p.userData.d = i % 2 ? 1 : -1; qs.add(p); return p; });
const GHOSTS = [0, 1, 2].map(i => { const p = makePerson({ skin: '#dfe8f4', hair: '#c8d4e4', shirt: '#e8eef6', pants: '#c8d4e4' }); p.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0; o.material.depthWrite = false; } }); p.position.set(SX + 2 + [-1.1, 1.15, 0.2][i], 0, [0.5, 0.4, -0.5][i]); p.rotation.y = [0.9, -0.9, 0][i]; qs.add(p); return p; });
function ghostOp(p, o) { p.traverse(m => { if (m.isMesh) m.material.opacity = o; }); p.visible = o > 0.01; }
const tPast = tag('遠い昔の王国', { size: 70, w: 500, bg: '#14161c', sx: 3.4 }); tPast.position.set(SX - 6.5, 5.3, -2.2); qs.add(tPast);
const tSee = tag('見えないものが見える', { size: 58, w: 640, bg: '#e6b450', color: '#14161c', sx: 1.5 }); tSee.position.set(SX + 2, 2.55, 0.7); qs.add(tSee);

// ---------- 4・6段目. 大きなお屋敷の居間（x=90）。同居人は記憶をなくした死神 ----------
const HX = 90;
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat('#5a4636')); fl.rotation.x = -Math.PI / 2; fl.position.set(HX, 0.02, 0); fl.receiveShadow = true; qs.add(fl);
  const wl = box(14, 6, 0.2, mat('#d8cfbe')); wl.position.set(HX, 3, -3.2); qs.add(wl);
  for (const x of [-3.4, 3.4]) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.2), new THREE.MeshBasicMaterial({ color: '#2a3a5a' })); wn.position.set(HX + x, 2.7, -3.08); qs.add(wn); }
  const sofa = box(3.0, 0.5, 0.9, mat('#6a3a3a')); sofa.position.set(HX, 0.25, -2.3); qs.add(sofa); const sb = box(3.0, 0.8, 0.25, mat('#6a3a3a')); sb.position.set(HX, 0.75, -2.7); qs.add(sb);
  const chand = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe8b0' })); chand.position.set(HX, 5.0, -0.8); qs.add(chand);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.4, 40), mat('#3a4a6a')); rug.rotation.x = -Math.PI / 2; rug.position.set(HX, 0.03, 0); qs.add(rug); }
const man4 = coat(makePerson(MAN)); man4.scale.setScalar(1.12); man4.position.set(HX - 0.8, 0, 0); man4.rotation.y = 0.5; qs.add(man4);
const reaper = makePerson(REAPER); reaper.scale.setScalar(1.12); reaper.position.set(HX + 0.8, 0, 0); reaper.rotation.y = -0.5; qs.add(reaper);
const MUGS = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.14, 12), mat('#f4f0e8')); qs.add(m); return m; });
const tHouse = tag('同居人', { size: 76, w: 340, bg: '#14161c', sx: 1.0 }); tHouse.position.set(HX + 0.8, 2.55, 0.1); qs.add(tHouse);
const tReaper = tag('記憶をなくした死神', { size: 60, w: 620, bg: '#e2483c', sx: 1.5 }); tReaper.position.set(HX + 0.3, 2.55, 0.1); qs.add(tReaper);
const sword = makeSword(); sword.position.set(0, 1.12, 0.0); man4.add(sword);
const tSword = tag('胸に剣', { size: 84, w: 340, bg: '#14161c', sx: 1.0 }); tSword.position.set(HX - 1.0, 2.45, 0.6); qs.add(tSword);
const tOnly = tag('抜けるのは花嫁だけ', { size: 62, w: 620, bg: '#e6b450', color: '#14161c', sx: 1.6 }); tOnly.position.set(HX - 0.7, 2.45, 0.6); qs.add(tOnly);
const girl6 = ribbon(makePerson(GIRL)); girl6.position.set(HX + 0.6, 0, 0.5); girl6.rotation.y = -1.2; qs.add(girl6);

// ---------- 5段目. 花の散るベンチ（x=120）。韓国の大ヒット・ファンタジーラブ ----------
const BX = 120;
{ const gr = new THREE.Mesh(new THREE.CircleGeometry(5, 48), mat('#3a4a3a')); gr.rotation.x = -Math.PI / 2; gr.position.set(BX, 0.03, 0); qs.add(gr);
  const seat = box(2.0, 0.08, 0.5, mat('#7a5232')); seat.position.set(BX, 0.48, -0.4); qs.add(seat); const back = box(2.0, 0.45, 0.06, mat('#7a5232')); back.position.set(BX, 0.78, -0.65); qs.add(back);
  for (const x of [-0.85, 0.85]) { const l = box(0.08, 0.48, 0.45, mat('#2a2a2e')); l.position.set(BX + x, 0.24, -0.4); qs.add(l); }
  for (const [x, z] of [[-3, -2.4], [3.2, -2.8]]) { const tr = box(0.3, 2.4, 0.3, mat('#4a3426')); tr.position.set(BX + x, 1.2, z); qs.add(tr); const c = new THREE.Mesh(new THREE.SphereGeometry(1.3, 14, 10), new THREE.MeshLambertMaterial({ color: '#f2b8c8' })); c.position.set(BX + x, 3.0, z); c.scale.set(1, 0.8, 1); qs.add(c); } }
const sitG = ribbon(makePerson(GIRL)); sitG.position.set(BX - 0.45, 0.06, -0.35); qs.add(sitG);
const sitM = coat(makePerson(MAN)); sitM.scale.setScalar(1.12); sitM.position.set(BX + 0.5, 0.0, -0.35); qs.add(sitM);
for (const p of [sitG, sitM]) { p.userData.legs.forEach(l => l.rotation.x = -1.45); }
const PETALS = []; for (let i = 0; i < 50; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.06), new THREE.MeshBasicMaterial({ color: '#f8c8d8', side: THREE.DoubleSide })); m.userData.x = BX - 4 + R() * 8; m.userData.z = -3 + R() * 5; m.userData.s = 0.4 + R() * 0.5; m.userData.o = R() * 10; qs.add(m); PETALS.push(m); }
const tKorea = tag('韓国の大ヒットドラマ', { size: 62, w: 720, bg: '#e6b450', color: '#14161c', sx: 2.0 }); tKorea.position.set(BX, 3.0, 0); qs.add(tKorea);
const tFan = tag('ファンタジー × 恋', { size: 66, w: 660, bg: '#e2483c', sx: 1.8 }); tFan.position.set(BX, 3.0, 0); qs.add(tFan);
const tTeam = tag('太陽の末裔のチーム', { size: 56, w: 600, bg: '#14161c', sx: 1.6 }); tTeam.position.set(BX, 2.3, 0.3); qs.add(tTeam);

// ---------- shots ----------
const ALL = [tBride, tWho, t900, tForever, tPast, tSee, tHouse, tReaper, tSword, tOnly, tKorea, tFan, tTeam];
function base() { S.reset(); PASS.forEach(p => p.visible = false); ALL.forEach(x => x.visible = false); LAMP1.intensity = 0; showSword(sword, 0); girl6.visible = false; GHOSTS.forEach(g => ghostOp(g, 0)); FALL.forEach(f => f.visible = false); PETALS.forEach(f => f.visible = false); }

function shotMeet(t, T) { // 1段目 0〜9：見知らぬ女子高生が、いきなり「わたしはあなたの花嫁です」（0秒目がサムネ）
  base(); S.aim(0, 0); lift(-60);
  S.hemi.intensity = 0.55; S.key.intensity = 0.25; S.darken(0.7, '#060814'); LAMP1.intensity = 70;
  girl1.userData.arms[1].rotation.x = -1.5; girl1.userData.arms[1].rotation.z = 0.25;
  tBride.userData.pop(1);
  // 男は思わず一歩さがる
  const back = ease((T - 3.0) / 0.8); man1.position.x = lerp(0.75, 0.95, back); man1.userData.head.rotation.x = -0.15 * back;
  tWho.userData.pop((T - 3.4) / 0.35); tWho.position.x = man1.position.x + 0.15;
  const u = ease(T / 9);
  look(lerp(0.0, 0.15, u), lerp(1.7, 1.8, u), lerp(5.2, 5.0, u), lerp(0.0, 0.15, u), 1.5, 0, 54);
  return qs;
}
function shotYears(t) { // 2段目 9〜17：およそ900年、死ねずに生きてきた男（季節だけがめぐる）
  base(); S.aim(MX, 0); lift(-40); S.hemi.intensity = 1.5;
  const ph = t * 0.55, si = Math.floor(ph) % 4, k = ph - Math.floor(ph);
  LEAF_M.color.set(SEASON[si]).lerp(new THREE.Color(SEASON[(si + 1) % 4]), ease((k - 0.6) / 0.4));
  S.scene.background.set(SEASON_BG[si]).lerp(new THREE.Color(SEASON_BG[(si + 1) % 4]), ease((k - 0.6) / 0.4)); S.scene.fog.color.copy(S.scene.background);
  FALL.forEach(f => { f.visible = true; f.material.color.copy(LEAF_M.color); const y = 5.5 - ((t * f.userData.s + f.userData.o) % 5.5); f.position.set(f.userData.x + Math.sin(t + f.userData.o) * 0.3, y, f.userData.z); f.rotation.set(t * 2 + f.userData.o, t, 0); });
  SAND.visible = true; SANDPILE.position.y = 0.2 + 0.06 * clamp(t / 8); SANDPILE.scale.setScalar(0.6 + 0.4 * clamp(t / 8));
  man2.userData.head.rotation.x = 0.2;
  t900.userData.pop((t - 0.5) / 0.35); if (t > 4.0) t900.visible = false;
  tForever.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(MX + lerp(-0.5, 0.3, u), lerp(1.7, 1.8, u), lerp(5.0, 4.4, u), MX, 1.5, 0, 54);
  return qs;
}
function shotEra(t) { // 3段目 17〜25：遠い昔の王国から、今の大都会へ。少女には、見えないものが見える
  base(); S.aim(SX, 0); lift(lerp(160, -40, ease((t - 2.6) / 2.0))); S.darken(0.3, '#0a1024'); S.hemi.intensity = 1.4;
  const pan = ease((t - 2.6) / 2.0);
  PASS.forEach(p => p.visible = true);
  PASS.forEach((p, i) => { const x = p.userData.x0 + p.userData.d * t * 0.8; p.position.set(SX + 2 + (((x - SX + 3) % 8) + 8) % 8 - 4, 0, p.userData.z); p.rotation.y = p.userData.d * Math.PI / 2; walk(p, t * 6 + i); });
  GHOSTS.forEach((g, i) => ghostOp(g, 0.6 * ease((t - 4.4 - i * 0.3) / 0.8)));
  girl3.rotation.y = Math.sin(t * 0.8) * 0.5 * clamp((t - 4.6) / 0.5); girl3.userData.head.rotation.y = Math.sin(t * 1.3) * 0.3 * clamp((t - 4.6) / 0.5);
  tPast.userData.pop((t - 0.4) / 0.35); if (t > 2.8) tPast.visible = false;
  tSee.userData.pop((t - 5.2) / 0.35);
  look(lerp(SX - 6.5, SX + 2, pan), lerp(3.2, 1.9, pan), lerp(10.5, 5.6, pan), lerp(SX - 6.5, SX + 2, pan), lerp(3.0, 1.4, pan), lerp(-2.5, 0, pan), 56);
  return qs;
}
function shotRoommate(t) { // 4段目 25〜33：大きなお屋敷で一緒に暮らすのは、記憶をなくした死神
  base(); S.aim(HX, 0); lift(-40); S.hemi.intensity = 1.0;
  man4.rotation.y = 0.5; reaper.rotation.y = -0.5;
  MUGS.forEach((m, i) => { const p = i ? reaper : man4; m.position.set(p.position.x + (i ? -0.32 : 0.32), 0.86 + Math.sin(t * 1.2 + i) * 0.03, 0.25); });
  man4.userData.arms[1].rotation.x = -0.9; reaper.userData.arms[0].rotation.x = -0.9;
  reaper.userData.head.rotation.z = t > 4 ? 0.15 * Math.sin((t - 4) * 1.5) : 0;
  tHouse.userData.pop((t - 0.6) / 0.35); if (t > 3.9) tHouse.visible = false;
  tReaper.userData.pop((t - 4.1) / 0.35);
  const u = ease(t / 8);
  look(HX + lerp(-0.5, 0.3, u), lerp(1.8, 1.7, u), lerp(5.2, 4.6, u), HX, 1.55, 0, 54);
  return qs;
}
function shotKorea(t) { // 5段目 33〜42：韓国の大ヒット、ファンタジー・ラブ。「太陽の末裔」の監督と脚本家
  base(); S.aim(BX, 0); lift(-40); S.hemi.intensity = 1.2; S.darken(0.2, '#2a2040');
  PETALS.forEach(f => { f.visible = true; const y = 5 - ((t * f.userData.s + f.userData.o) % 5); f.position.set(f.userData.x + Math.sin(t * 0.8 + f.userData.o) * 0.4, y, f.userData.z); f.rotation.set(t * 1.5 + f.userData.o, t, 0); });
  sitG.userData.head.rotation.y = -0.3 * ease((t - 2) / 1); sitM.userData.head.rotation.y = 0.2 * ease((t - 2.6) / 1);
  tKorea.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tKorea.visible = false;
  tFan.userData.pop((t - 4.2) / 0.35); tTeam.userData.pop((t - 5.2) / 0.35);
  const u = ease(t / 9);
  look(BX, lerp(1.6, 1.8, u), lerp(5.4, 4.8, u), BX, 1.55, -0.3, 56);
  return qs;
}
function shotSword(t) { // 6段目 42〜49（決め手）：男の胸には剣。抜けるのは、花嫁だけ
  base(); S.aim(HX, 0); lift(140);
  S.hemi.intensity = 0.9; S.key.intensity = 0.6; S.darken(0.5, '#060814');
  girl6.visible = true; man4.rotation.y = 0.35; reaper.visible = false;
  showSword(sword, ease((t - 0.4) / 1.0)); sword.userData.mats[3].opacity = 0.22 * clamp((t - 0.4) / 1.0) * (0.75 + 0.25 * Math.sin(t * 6));
  girl6.userData.arms[1].rotation.x = -1.2 * ease((t - 3.4) / 0.8);
  tSword.userData.pop((t - 1.0) / 0.35); if (t > 3.3) tSword.visible = false;
  tOnly.userData.pop((t - 3.5) / 0.35);
  const u = ease(t / 7);
  look(HX + lerp(-2.6, -2.3, u), lerp(2.0, 1.9, u), lerp(4.6, 4.2, u), HX - 0.4, 1.45, 0, 52);
  MUGS.forEach(m => m.visible = false);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（夜の路地。少女と男が向きあう）
  base(); S.aim(0, 0); lift(-60);
  MUGS.forEach(m => m.visible = true); reaper.visible = true;
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(0.55, 0.15, d); S.key.intensity = lerp(0.25, 0, d); S.darken(lerp(0.7, 1, d), '#05060c');
  LAMP1.intensity = lerp(70, 20, d);
  S.spot.color.set(0xff3b2e); S.spot.position.set(0.2, 5.2, 1.2); S.spot.target.position.set(0.2, 1.0, 0.2); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  man1.position.x = 0.75; girl1.userData.arms[1].rotation.x = 0;
  const k = ease(t / 7);
  look(lerp(0.0, 0.1, k), lerp(1.8, 2.0, k), lerp(5.0, 4.2, k), 0.1, 1.5, 0, 52);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotMeet },
  { a: 9, b: 17, f: shotYears },
  { a: 17, b: 25, f: shotEra },
  { a: 25, b: 33, f: shotRoommate },
  { a: 33, b: 42, f: shotKorea },
  { a: 42, b: 49, f: shotSword },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '見知らぬ女子高生が、<br>いきなり言った。'],
  [5.6, 9.0, 'わたしは、<br>あなたの花嫁です。'],
  [9.2, 13.2, 'およそ900年、<br>死ねずに生きてきた男。'],
  [13.2, 17.0, '終わらない命から、<br>解放されたいと願っている。'],
  [17.2, 21.0, '遠い昔の王国から、<br>ビルの並ぶ今の街へ。'],
  [21.0, 25.0, '少女には、ほかの人に<br>見えないものが見える。'],
  [25.2, 29.0, '大きなお屋敷で、<br>一緒に暮らしているのは、'],
  [29.0, 33.0, '記憶をなくした、<br>死神。'],
  [33.2, 37.4, '韓国の大ヒット、<br>ファンタジー・ラブ。'],
  [37.4, 41.8, '太陽の末裔の、<br>監督と脚本家が組んだ。'],
  [42.2, 45.4, '男の胸には、<br>剣が刺さっている。'],
  [45.4, 49.0, 'それを抜けるのは、<br>花嫁だけ。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、トッケビ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q028', v2: true, answer: 'トッケビ～君がくれた愛しい日々～',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'emotional', seed: 2828,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.6, 12.4, 22.0, 29.2, 37.6, 43.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [43.4, 'poof'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '見知らぬ': 'みしらぬ', '女子高生': 'じょしこうせい', '言った': 'いった', '花嫁': 'はなよめ', '900年': 'きゅうひゃくねん', '死ねずに': 'しねずに', '生きてきた': 'いきてきた', '男': 'おとこ', '終わらない': 'おわらない', '命': 'いのち', '解放': 'かいほう', '願って': 'ねがって', '遠い昔': 'とおいむかし', '王国': 'おうこく', '並ぶ': 'ならぶ', '今の街': 'いまのまち', '少女': 'しょうじょ', '見えない': 'みえない', '見える': 'みえる', 'お屋敷': 'おやしき', '一緒に': 'いっしょに', '暮らして': 'くらして', '記憶': 'きおく', '死神': 'しにがみ', '韓国': 'かんこく', '大ヒット': 'だいヒット', '太陽の末裔': 'たいようのまつえい', '監督': 'かんとく', '脚本家': 'きゃくほんか', '組んだ': 'くんだ', '胸': 'むね', '剣': 'けん', '刺さって': 'ささって', '抜ける': 'ぬける', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n見知らぬ女子高生が、いきなり言った。わたしは、あなたの花嫁です。言われた男は、およそ900年、死ねずに生きてきた。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'ディズニープラス', '韓国ドラマ', 'ドラマ好き'],
  },
});
applyQuizCards({ answer: 'トッケビ<br><span style="font-size:56px">～君がくれた愛しい日々～</span>', info: 'Prime Video・Disney+｜韓国ドラマ', answerSize: 128 });
