import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #021 KPOPガールズ！デーモン・ハンターズ（映画・アメリカ・2025年・アニメ。Netflixで見放題、justwatch.com/jp/映画/kpopgaruzu-demonhantazu で2026/11/2確認。Filmarks 3.8 filmarks.com/movies/117010）
// 設定：スタジアムを満員にするK-POPスーパースターの3人組。その裏では正体を隠し、秘密の能力でなぞの脅威からファンを守るデーモン・ハンターでもある。
//       最大の敵は、ライバルのボーイズバンドに化けたデーモンたち。Netflixの映画として歴代いちばん観られた作品になった（映画.com の作品解説・シネマトゥデイの記事・Filmarks の作品ページ）
// 構成（ヒント6段）：1 満員のスタジアムの3人、客席の奥に何かが紛れこむ → 2 世界中で大人気、ファンに言えない秘密 → 3 夜はネオンの街の屋根の上、もうひとつの仕事
//       → 4 秘密の力でファンを守る、ライバルの男性グループ → 5 K-POPの世界が舞台のアメリカのアニメ映画 → 6 決め手：ライバルの正体は、アイドルに化けた悪魔。Netflix映画で歴代いちばん観られた
// 主人公の出生の秘密・結末には触れない。歌詞・曲・振り付け・キャラクターの見た目・ロゴ・有名な場面の構図は使わない。怪物は黒い影と光る目だけ。人と街は汎用の3D

const S = quizStage({ bg: '#1a1630', floor: '#1e1a2c', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(2121);
const GIRLS = [
  { skin: '#f5d3b5', hair: '#6a3a9a', shirt: '#e6b450', pants: '#2a2a3a', long: true, skirt: true },
  { skin: '#efcfae', hair: '#c83a5a', shirt: '#e8e8f0', pants: '#2a2a3a', long: true },
  { skin: '#f1c9a5', hair: '#1a1a22', shirt: '#4fa3d1', pants: '#2a2a3a', long: true, skirt: true },
];
const BOYS = [0, 1, 2, 3, 4].map(i => ({ skin: ['#f1c9a5', '#efcfae', '#f5d3b5', '#e8b98f', '#f1c9a5'][i], hair: ['#1a1a1a', '#e8e0d0', '#2c2421', '#6a2a2a', '#1a1a22'][i], shirt: '#1a1a1e', pants: '#141418' }));
function glowMat(c) { return new THREE.MeshBasicMaterial({ color: c }); }
function beamMesh(c) { const m = new THREE.Mesh(new THREE.ConeGeometry(1.4, 12, 16, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })); m.material.fog = false; return m; }

// ---------- 1・クイズ. スタジアム（x=0）。0秒目がサムネ ----------
const STAGE = new THREE.Group(); STAGE.position.set(0, 0, -6); qs.add(STAGE);
{ const st = box(10, 1.0, 5, mat('#2a2640')); st.position.set(0, 0.5, 0); STAGE.add(st);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshBasicMaterial({ color: '#3a2a6a' })); scr.position.set(0, 4.6, -2.4); STAGE.add(scr);
  for (let i = 0; i < 12; i++) { const b = box(0.5, 0.2 + (i % 4) * 0.5, 0.1, glowMat(['#e6b450', '#e2607c', '#4fa3d1'][i % 3])); b.position.set(-4.4 + i * 0.8, 2.6 + (0.2 + (i % 4) * 0.5) / 2, -2.3); STAGE.add(b); }
  for (const x of [-5.6, 5.6]) { const t = box(0.4, 7, 0.4, mat('#3a3a4a')); t.position.set(x, 3.5, -1); STAGE.add(t); } }
const BEAMS = [];
for (let i = 0; i < 6; i++) { const b = beamMesh(['#e6b450', '#e2607c', '#4fa3d1'][i % 3]); b.position.set(-5 + i * 2, 6.5, -7); qs.add(b); BEAMS.push(b); }
const IDOL = GIRLS.map((o, i) => { const p = makePerson(o); p.position.set(-1.3 + i * 1.3, 1.0, -5.4); qs.add(p); return p; });
const CROWD = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.4, 0.3), mat('#2a2a3a'), 320);
const STICKS = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 4), glowMat('#ffffff'), 320);
{ const m = new THREE.Matrix4(); const col = new THREE.Color(); let n = 0; for (let r = 0; r < 16; r++) for (let c = 0; c < 20; c++) { const x = -9.5 + c + (r % 2) * 0.5, z = -1.5 + r * 0.9, y = 0.9 + r * 0.22; m.makeTranslation(x, y, z); CROWD.setMatrixAt(n, m); m.makeTranslation(x + 0.1, y + 0.55, z); STICKS.setMatrixAt(n, m); STICKS.setColorAt(n, col.set(['#e6b450', '#e2607c', '#4fa3d1', '#ffffff'][(r + c) % 4])); n++; } }
qs.add(CROWD); qs.add(STICKS);
const LURK = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.7, 4, 10), mat('#08060c')); b.position.y = 0.6; LURK.add(b); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), glowMat('#ff3a3a')); e.position.set(s * 0.1, 1.05, 0.3); LURK.add(e); } } LURK.position.set(2.4, 3.6, 12.0); LURK.rotation.y = Math.PI; LURK.scale.setScalar(1.5); qs.add(LURK);
const tThree = tag('人気の3人組', { size: 66, w: 460, bg: '#e6b450', color: '#14161c', sx: 1.4 }); tThree.position.set(0, 3.4, -5.4); qs.add(tThree);

// ---------- 2. 楽屋の鏡（x=30） ----------
{ const fl = box(10, 0.1, 8, mat('#3a3040')); fl.position.set(30, 0.05, -1); qs.add(fl);
  const wall = box(10, 4, 0.2, mat('#4a3e58')); wall.position.set(30, 2, -3.2); qs.add(wall);
  const mir = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.6), new THREE.MeshBasicMaterial({ color: '#8a90b0' })); mir.position.set(30, 1.9, -3.08); qs.add(mir);
  for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), glowMat('#fff2c8')); const u = i / 11; b.position.set(27.6 + u * 4.8, i < 6 ? 2.8 : 1.0, -3.05); if (i >= 6) b.position.x = 27.6 + (i - 6) / 5 * 4.8; qs.add(b); }
  const tbl = box(5, 0.1, 0.8, mat('#e8e2d4')); tbl.position.set(30, 0.85, -2.6); qs.add(tbl);
  const caseB = box(1.1, 0.4, 0.5, mat('#14141c')); caseB.position.set(31.6, 1.1, -2.6); qs.add(caseB);
  const lock = box(0.14, 0.14, 0.04, glowMat('#e6b450')); lock.position.set(31.6, 1.1, -2.33); qs.add(lock); }
const ROOM = GIRLS.map((o, i) => { const p = makePerson(o); p.position.set(28.8 + i * 1.2, 0, -1.6); p.rotation.y = Math.PI; qs.add(p); return p; });
const tStar = tag('世界中で大人気', { size: 64, w: 520, bg: '#e2607c', sx: 1.3 }); tStar.position.set(30.2, 2.25, -1.6); qs.add(tStar);
const tSecret = tag('ファンに言えない秘密', { size: 58, w: 620, bg: '#14161c', sx: 1.5 }); tSecret.position.set(30.4, 2.25, -1.6); qs.add(tSecret);

// ---------- 3・4. 夜のネオン街の屋根の上（x=60） ----------
const ROOF = new THREE.Group(); ROOF.position.set(60, 0, 0); qs.add(ROOF);
{ const top = box(8, 0.3, 6, mat('#2a2838')); top.position.set(0, 6, -1); ROOF.add(top);
  const bld = box(8, 6, 6, mat('#1e1c2a')); bld.position.set(0, 3, -1); ROOF.add(bld);
  for (let i = 0; i < 26; i++) { const h = 5 + R() * 14, w = 2 + R() * 3; const x = (R() - 0.5) * 50, z = -10 - R() * 30; const b = box(w, h, w, mat('#1a1828')); b.position.set(x, h / 2, z); ROOF.add(b);
    if (R() < 0.7) { const n = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.7, 0.5 + R() * 0.8), glowMat(['#e2607c', '#4fa3d1', '#e6b450', '#8a5ae2', '#4fd1a3'][i % 5])); n.position.set(x, h * (0.4 + R() * 0.4), z + w / 2 + 0.02); n.material.fog = false; ROOF.add(n); }
    for (let k = 0; k < 6; k++) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), glowMat('#ffe2a0')); wn.position.set(x + (R() - 0.5) * w * 0.8, R() * h, z + w / 2 + 0.01); ROOF.add(wn); } }
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.6, 12), mat('#3a3848')); tank.position.set(-2.8, 7, -3); ROOF.add(tank);
  const op = box(8, 6, 6, mat('#1e1c2a')); op.position.set(0, 3.6, -11); ROOF.add(op); const opt = box(8, 0.3, 6, mat('#2a2838')); opt.position.set(0, 6.6, -11); ROOF.add(opt); }
const RL = new THREE.PointLight(0xc070ff, 0, 16, 1.2); RL.position.set(60, 9.5, 3); qs.add(RL);
const ROOFG = GIRLS.map((o, i) => { const p = makePerson(o); p.position.set(58.8 + i * 1.2, 6.15, 0.6); p.rotation.y = Math.PI; qs.add(p); return p; });
const WEAP = ROOFG.map((p, i) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8), glowMat(['#ffe08a', '#ff8ab8', '#8adcff'][i])); w.position.set(0, -0.6, 0.15); w.rotation.x = Math.PI / 2; p.userData.arms[1].add(w); w.visible = false; return w; });
const SHADES = [0, 1, 2, 3].map(i => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.6, 4, 10), mat('#060408')); b.position.y = 0.6; g.add(b); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), glowMat('#ff3a3a')); e.position.set(s * 0.11, 1.0, 0.3); g.add(e); } g.position.set(57.2 + i * 1.3, 6.15, -3.6); qs.add(g); return g; });
const RIVAL = BOYS.map((o, i) => { const p = makePerson(o); p.position.set(57.6 + i * 1.2, 6.75, -10.4); qs.add(p); return p; });
const tNight = tag('もうひとつの仕事', { size: 62, w: 560, bg: '#8a5ae2', sx: 1.6 }); tNight.position.set(60, 9.0, 0.4); qs.add(tNight);
const tProtect = tag('ファンを守る', { size: 66, w: 440, bg: '#e6b450', color: '#14161c', sx: 1.4 }); tProtect.position.set(60, 8.9, 0.4); qs.add(tProtect);
const tRival = tag('ライバルの男性グループ', { size: 56, w: 680, bg: '#14161c', sx: 4.2 }); tRival.position.set(60, 9.4, -10.4); qs.add(tRival);

// ---------- 5. 街の大きな画面（x=120） ----------
const SCREEN = new THREE.Group(); SCREEN.position.set(120, 0, -6); qs.add(SCREEN);
{ const fr = box(9, 6, 0.4, mat('#2a2838')); fr.position.set(0, 6, 0); SCREEN.add(fr);
  const legs = box(0.6, 3, 0.6, mat('#2a2838')); legs.position.set(0, 1.5, 0); SCREEN.add(legs);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 5.4), glowMat('#241a44')); gl.position.set(0, 6, 0.21); SCREEN.add(gl);
  for (let i = 0; i < 26; i++) { const x = (R() - 0.5) * 40, z = 2 - R() * 20; if (Math.abs(x) < 6 && z < 4) continue; const h = 4 + R() * 10; const b = box(3, h, 3, mat('#1a1828')); b.position.set(x, h / 2, z - 6); SCREEN.add(b); } }
const EQ = []; for (let i = 0; i < 14; i++) { const b = box(0.4, 1, 0.05, glowMat(['#e6b450', '#e2607c', '#4fa3d1', '#8a5ae2'][i % 4])); b.position.set(120 - 3.5 + i * 0.54, 4.6, -5.7); qs.add(b); EQ.push(b); }
const NOTES = []; { const tx = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(46, 92, 22, 16, -0.4, 0, Math.PI * 2); g.fill(); g.fillRect(62, 22, 8, 70); g.fillRect(62, 22, 40, 10); });
  for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, color: ['#e6b450', '#e2607c', '#4fa3d1'][i % 3] })); s.scale.set(0.8, 0.8, 1); qs.add(s); NOTES.push(s); } }
const tKpop = tag('K-POPの世界', { size: 70, w: 460, bg: '#e2607c', sx: 2.6 }); tKpop.position.set(120, 7.4, -5.5); qs.add(tKpop);
const tAnime = tag('アメリカのアニメ映画', { size: 60, w: 660, bg: '#14161c', sx: 3.4 }); tAnime.position.set(120, 6.1, -5.5); qs.add(tAnime);
const tAction = tag('歌とアクション', { size: 66, w: 500, bg: '#e6b450', color: '#14161c', sx: 2.8 }); tAction.position.set(120, 7.4, -5.5); qs.add(tAction);

// ---------- 6. ライバルの影に角（x=150） ----------
const BACK = new THREE.Group(); BACK.position.set(150, 0, 0); qs.add(BACK);
{ const fl = box(12, 0.6, 6, mat('#22202e')); fl.position.set(0, 0.3, -1); BACK.add(fl); const wall = box(12, 7, 0.2, mat('#c8c0d8')); wall.position.set(0, 3.5, -3.6); BACK.add(wall); }
const RIV6 = BOYS.map((o, i) => { const p = makePerson(o); p.position.set(147.6 + i * 1.2, 0.6, -0.6); qs.add(p); return p; });
const SIL = RIV6.map((p, i) => { const g = new THREE.Group(); const b = box(0.9, 2.2, 0.02, new THREE.MeshBasicMaterial({ color: '#1a1424' })); b.position.y = 1.5; g.add(b); const hd = box(0.6, 0.6, 0.02, new THREE.MeshBasicMaterial({ color: '#1a1424' })); hd.position.y = 2.9; g.add(hd); for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 4), new THREE.MeshBasicMaterial({ color: '#1a1424' })); h.position.set(s * 0.22, 3.4, 0); h.rotation.z = -s * 0.35; g.add(h); const e = new THREE.Mesh(new THREE.CircleGeometry(0.06, 10), glowMat('#ff3a3a')); e.position.set(s * 0.13, 2.95, 0.02); g.add(e); } g.position.set(147.6 + i * 1.2 + 0.3, 0.6, -3.48); g.scale.set(1.1, 1.0, 1); qs.add(g); return g; });
const SPOT6 = new THREE.SpotLight(0xffffff, 0, 20, 0.6, 0.4, 1); SPOT6.position.set(150, 5, 6); SPOT6.target.position.set(150, 1.5, -2); qs.add(SPOT6); qs.add(SPOT6.target);
const tDemon = tag('正体は、アイドルに化けた悪魔', { size: 54, w: 760, bg: '#c8282a', sx: 2.5 }); tDemon.position.set(150, 4.6, -0.4); qs.add(tDemon);
const tNo1 = tag('Netflix映画 歴代いちばん', { size: 56, w: 720, bg: '#e6b450', color: '#14161c', sx: 2.4 }); tNo1.position.set(150, 5.5, -0.4); qs.add(tNo1);

// ---------- shots ----------
const ALL = [tThree, tStar, tSecret, tNight, tProtect, tRival, tKpop, tAnime, tAction, tDemon, tNo1];
function base() { RL.intensity = 0; S.reset(); ALL.forEach(x => x.visible = false); BEAMS.forEach(b => b.visible = false); NOTES.forEach(n => n.visible = false); SPOT6.intensity = 0; WEAP.forEach(w => w.visible = false); }
function concert(T) { S.darken(0.5, '#0a0814'); S.hemi.intensity = 0.7; S.key.intensity = 0.5; BEAMS.forEach((b, i) => { b.visible = true; b.rotation.z = Math.sin(T * 0.9 + i) * 0.45; b.rotation.x = 0.35 + Math.sin(T * 0.7 + i * 2) * 0.2; });
  IDOL.forEach((p, i) => { const a = T * 6 + i; p.userData.arms[0].rotation.x = -1.2 - Math.sin(a) * 0.6; p.userData.arms[1].rotation.x = -0.4 + Math.sin(a) * 0.4; p.position.y = 1.0 + Math.abs(Math.sin(a)) * 0.08; }); }
function shotStadium(t, T) { // 0〜9：満員のスタジアム。客席の奥に、何かが紛れこんでいる（0秒目がサムネ）
  base(); S.aim(0, 0); lift(80);
  concert(T);
  LURK.visible = true;
  tThree.userData.pop((T - 3.0) / 0.35); if (T > 5.4) tThree.visible = false;
  if (T < 5.6) { const u = ease(T / 5.6); look(lerp(0.6, 0.3, u), lerp(5.2, 4.8, u), lerp(9.0, 8.0, u), 0, 2.2, -5.4, lerp(36, 32, u)); }
  else { const k = ease((T - 5.6) / 3.0); look(lerp(0.2, 0.6, k), 3.4, lerp(-4.4, -3.6, k), 2.4, 4.3, 12, lerp(44, 34, k)); }
  return qs;
}
function shotRoom(t) { // 9〜17：世界中で大人気。でも、ファンに言えない秘密がある
  base(); S.aim(30, -2); lift(80);
  S.hemi.intensity = 1.1; S.key.intensity = 0.7;
  ROOM.forEach((p, i) => { p.userData.head.rotation.y = t > 4.4 && i === 2 ? 0.5 : 0; });
  tStar.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tStar.visible = false;
  tSecret.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(32.8, 32.4, u), lerp(1.9, 1.8, u), lerp(0.9, 0.5, u), 29.9, 1.35, -2.2, 56);
  return qs;
}
function night() { S.darken(0.8, '#140f2a'); S.hemi.intensity = 0.95; S.key.intensity = 0.45; RL.intensity = 14; }
function shotRoof(t) { // 17〜25：夜になると、ネオンの街の屋根の上へ。もうひとつの仕事がある
  base(); S.aim(60, 0); lift(80);
  night();
  ROOFG.forEach((p, i) => { const k = easeOut(clamp((t - 0.4 - i * 0.3) / 0.6)); p.position.y = 6.15 + (1 - k) * 3; p.visible = k > 0; p.rotation.y = Math.PI; });
  SHADES.forEach(g => g.visible = false); RIVAL.forEach(p => p.visible = false);
  tNight.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(60.6, 60.2, u), lerp(9.2, 9.6, u), lerp(9.6, 8.6, u), 60, 7.0, -12, 56);
  return qs;
}
function shotFight(t, T) { // 25〜33：秘密の力でファンを守る。そこへ、ライバルの男性グループ
  base(); S.aim(60, -4); lift(60);
  night();
  ROOFG.forEach((p, i) => { p.visible = true; p.position.y = 6.15; p.rotation.y = Math.PI; p.userData.arms[1].rotation.x = -1.4; });
  WEAP.forEach(w => w.visible = true);
  SHADES.forEach((g, i) => { g.visible = t < 3.6; g.position.z = -3.6 + Math.sin(T * 2 + i) * 0.1; const s = t > 2.6 ? Math.max(0.01, 1 - (t - 2.6) / 0.8) : 1; g.scale.setScalar(s); });
  RIVAL.forEach((p, i) => { p.visible = t > 4.0; });
  tProtect.userData.pop((t - 0.6) / 0.35); if (t > 3.8) tProtect.visible = false;
  tRival.userData.pop((t - 4.6) / 0.35);
  const k = ease((t - 3.6) / 1.6);
  look(lerp(60.6, 60.2, k), lerp(9.0, 9.4, k), lerp(8.4, 9.0, k), 60, lerp(6.8, 7.4, k), lerp(-3, -10.4, k), 56);
  return qs;
}
function shotScreen(t, T) { // 33〜42：K-POPの世界が舞台の、アメリカのアニメ映画。歌とアクション
  base(); S.aim(120, -4); lift(220);
  night();
  EQ.forEach((b, i) => { const h = 0.4 + Math.abs(Math.sin(T * 5 + i * 0.7)) * 2.4; b.scale.y = h; b.position.y = 3.6 + h / 2; });
  NOTES.forEach((n, i) => { n.visible = true; const u = ((T * 0.3 + i / 6) % 1); n.position.set(120 + Math.sin(i * 2.3) * 3.6, 3 + u * 6, -4.6); n.material.opacity = Math.sin(u * Math.PI); });
  tKpop.userData.pop((t - 0.5) / 0.35); tAnime.userData.pop((t - 1.3) / 0.35); if (t > 4.0) tKpop.visible = false;
  tAction.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 9);
  look(120, lerp(3.4, 3.8, u), lerp(9.0, 8.0, u), 120, 6.0, -6, 58);
  return qs;
}
function shotDemon(t, T) { // 42〜49：決め手。ライバルの正体は、アイドルに化けた悪魔。Netflix映画で歴代いちばん観られた
  base(); S.aim(150, -1); lift(80);
  S.darken(0.6, '#0c0a1a'); S.hemi.intensity = 0.6; S.key.intensity = 0.2; SPOT6.intensity = 30;
  const k = clamp((t - 0.3) / 1.2); SIL.forEach((g, i) => { g.scale.set(1.1, lerp(0.9, 1.1, k), 1); g.children.forEach(c => { if (c.geometry.type === 'ConeGeometry' || c.geometry.type === 'CircleGeometry') c.visible = k > 0.5; }); });
  tDemon.userData.pop((t - 0.6) / 0.35); tNo1.userData.pop((t - 3.4) / 0.35);
  const u = ease(t / 7);
  look(lerp(150.4, 150.0, u), lerp(2.2, 2.6, u), lerp(8.6, 9.6, u), 150, 2.8, -1.5, 56);
  return qs;
}
function shotQuiz(t, T) { // 49〜56：この映画、わかった？（スタジアム）
  base(); S.aim(0, 0); lift(300);
  concert(T + 9); LURK.visible = false;
  const u = ease(t / 7);
  look(lerp(-1.6, 1.6, u), lerp(6.4, 6.8, u), lerp(14.5, 15.0, u), 0, 3.0, -6, 44);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotStadium(t, T) },
  { a: 9, b: 17, f: shotRoom },
  { a: 17, b: 25, f: shotRoof },
  { a: 25, b: 33, f: (t, T) => shotFight(t, T) },
  { a: 33, b: 42, f: (t, T) => shotScreen(t, T) },
  { a: 42, b: 49, f: (t, T) => shotDemon(t, T) },
  { a: 49, b: 56, f: (t, T) => shotQuiz(t, T) },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '満員のスタジアム。<br>ステージには3人組。'],
  [5.6, 9.0, 'でも、客席の奥に、<br>何かが紛れこんでいる。'],
  [9.2, 13.2, '3人は、世界中で<br>大人気のスター。'],
  [13.2, 17.0, 'でも、ファンには<br>言えない秘密がある。'],
  [17.2, 21.0, '夜になると、<br>ネオンの街の屋根の上へ。'],
  [21.0, 25.0, '3人には、もうひとつの<br>仕事がある。'],
  [25.2, 29.0, '秘密の力で、なぞの<br>脅威からファンを守る。'],
  [29.0, 33.0, 'そこへ現れたのは、<br>ライバルの男性グループ。'],
  [33.2, 37.4, 'K-POPの世界が舞台の、<br>アメリカのアニメ映画。'],
  [37.4, 41.8, '歌とアクションが、<br>たっぷり詰まっている。'],
  [42.2, 45.4, 'ライバルの正体は、<br>アイドルに化けた悪魔。'],
  [45.4, 49.0, 'Netflix映画で、<br>歴代いちばん観られた。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、KPOPガールズ！<br>デーモン・ハンターズ。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q021', v2: true, answer: 'KPOPガールズ！デーモン・ハンターズ',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 2121,
    hits: [5.6, 29.0, 56.4], risers: [52.0],
    impacts: [0.3, 5.6, 29.0, 42.2, 45.4, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'drone'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [27.8, 'poof'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '満員': 'まんいん', '3人組': 'さんにんぐみ', '3人': 'さんにん', '客席': 'きゃくせき', '奥': 'おく', '何か': 'なにか', '紛れこんで': 'まぎれこんで', '世界中': 'せかいじゅう', '大人気': 'だいにんき', '言えない': 'いえない', '秘密': 'ひみつ', '夜': 'よる', '街': 'まち', '屋根の上': 'やねのうえ', '仕事': 'しごと', '力': 'ちから', '脅威': 'きょうい', '守る': 'まもる', '現れた': 'あらわれた', '男性': 'だんせい', 'K-POP': 'ケーポップ', '舞台': 'ぶたい', '映画': 'えいが', '歌': 'うた', '詰まって': 'つまって', '正体': 'しょうたい', '化けた': 'ばけた', '悪魔': 'あくま', 'Netflix': 'ネットフリックス', '歴代': 'れきだい', '観られた': 'みられた', 'KPOPガールズ': 'ケーポップガールズ' },
    caption: 'この映画のタイトル、わかる？\n満員のスタジアム。ステージには3人組。でも、客席の奥に何かが紛れこんでいる。世界中で大人気の3人には、ファンに言えない秘密があった。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '映画好き', '映画紹介'],
  },
});
applyQuizCards({ answer: 'KPOPガールズ！<br><span style="font-size:76px">デーモン・ハンターズ</span>', info: 'Netflix｜アメリカのアニメ映画', answerSize: 96 });
