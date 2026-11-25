import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #144 恋のゴールドメダル～僕が恋したキム・ボクジュ～（ドラマ・韓国・2016年。FOD・U-NEXT で見放題、
//   JustWatch 日本版 justwatch.com/jp/テレビ番組/yeogdoyojeong-gimbogju（見放題：FOD・U-NEXT・Netflix・Prime Video・Disney Plus）と
//   Filmarks の動画配信欄（U-NEXT・DMM TV・FOD・Lemino・ABEMA・Hulu・Netflix 見放題）で2026/11/25確認。
//   Filmarks 4.2・レビュー34,944件 filmarks.com/dramas/947/2085）
// 確かめた事実（2026/11/25）：
//   ・Netflix 作品ページ netflix.com/jp/title/80188662 ：男子水泳部のトップ選手と女子重量挙げ部のエース。小学校時代の同級生2人がふとしたことで再会。
//     体育大学を舞台に、夢を追う若者たちの青春がつづられる。第1話：主人公は体育大学の重量挙げ部期待の星。一方、水泳部の彼は本番に弱い。
//     ある日、自転車に乗っていた彼は主人公にぶつかる。プールに落ちた主人公は彼に助けられ、小学生の頃幼なじみだったことを互いに思い出す。
//     ジャンル：青春・学園、ラブコメディ、スポーツ
//   ・JustWatch 日本版の紹介文（(C) 2016-7 MBC）：彼は主人公の姿を見かけてはわざと昔のあだ名で呼んでからかうが、実は彼女の行動が気になって仕方がない
// 構成（ヒント6段）：1 自転車とぶつかってプールに落ちる・助けてくれたのは見覚えのある顔 → 2 主人公は体育大学の女子学生・練習ではだれにも負けない期待の星
//   → 3 舞台はスポーツ選手が集まる大学・彼は水泳部のエースでも本番に弱い → 4 彼は小学校の同級生だった・昔のあだ名でからかってくる
//   → 5 2016年の韓国ドラマ・大学スポーツの青春ラブコメ → 6 決め手：彼女の競技は重量挙げ・バーベルより恋のほうがむずかしい
// 結末・恋の行方は言わない。登場人物の名前・大学の名前は出さない。俳優の顔・ポスター・ロゴ・人物の見た目（髪型・体型）は使わない。
// 有名な場面の構図はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#b8d8ec', floor: '#a8b0a0', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(14410);

const HER = { skin: '#f4d3b5', hair: '#2a1a14', shirt: '#e85a6a', pants: '#2a3a5a', long: false };
const HIM = { skin: '#f1c9a5', hair: '#1a1410', shirt: '#3a8ad8', pants: '#2a2e38' };
const ETC = [{ skin: '#f1c9a5', hair: '#2a2018', shirt: '#e8c040', pants: '#2a2e38' }, { skin: '#f4d3b5', hair: '#4a2a1a', shirt: '#6ab07a', pants: '#3a3a44', long: true }, { skin: '#eacbb0', hair: '#1a1a1a', shirt: '#e8e8ec', pants: '#2a2e38' }];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
const skyTex = (a, b) => new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
const waterMat = () => new THREE.MeshLambertMaterial({ map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#4ab0e0'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; for (let i = 0; i < 18; i++) { g.beginPath(); const y = i * 14 + 4; g.moveTo(0, y); for (let x = 0; x < w; x += 16) g.quadraticCurveTo(x + 8, y + (i % 2 ? 4 : -4), x + 16, y); g.stroke(); } }) });
function bike() { const g = new THREE.Group(); const m = mat('#2a2a30');
  for (const x of [-0.5, 0.5]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 6, 20), m); w.position.set(x, 0.33, 0); g.add(w); }
  const f = box(1.0, 0.05, 0.05, mat('#d83a3a')); f.position.y = 0.6; g.add(f); const st = box(0.05, 0.5, 0.05, mat('#d83a3a')); st.position.set(-0.2, 0.55, 0); st.rotation.z = 0.3; g.add(st);
  const hb = box(0.05, 0.05, 0.5, m); hb.position.set(0.5, 0.9, 0); g.add(hb); const sd = box(0.2, 0.05, 0.12, m); sd.position.set(-0.3, 0.82, 0); g.add(sd); return g; }

// ---------- 1段目. 晴れた日の大学の屋外プール（x=0）。プールに落ちた女の子、そばに倒れた自転車、手をのばす青年 ----------
const SKY1 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#6ab0e8', '#e8f4f8')); SKY1.position.set(0, 12, -40); qs.add(SKY1);
{ const dk = box(16, 0.3, 12, mat('#e8e4d8')); dk.position.set(0, 0.15, -4); qs.add(dk);
  const fc = box(16, 1.6, 0.1, mat('#8a9aa8')); fc.position.set(0, 1.1, -10); qs.add(fc);
  for (let i = 0; i < 3; i++) { const bd = box(5, 4 + i, 4, mat(['#d8c8b0', '#c8b8a0', '#e0d0b8'][i])); bd.position.set(-6 + i * 6, 2 + i * 0.5, -16); qs.add(bd); } }
const POOL1 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 4), waterMat()); POOL1.position.set(0, 0.28, -4.6); qs.add(POOL1);
{ for (const s of [-1, 1]) { const ed = box(6.4, 0.08, 0.2, mat('#f0f0f0')); ed.position.set(0, 0.32, -4.6 + s * 2.1); qs.add(ed); } }
const HER1 = person(HER, -0.4, -4.4, 0.4, -0.7);
const SPLASH1 = []; for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), gl('#e8f8ff')); d.userData.o = [R() * 6.28, 0.6 + R() * 0.8]; qs.add(d); SPLASH1.push(d); }
const BIKE1 = bike(); BIKE1.position.set(1.8, 0.3, -2.0); BIKE1.rotation.set(0, 0.6, 1.3); qs.add(BIKE1);
const HIM1 = person(HIM, 0.9, -2.4, -2.4, 0.3);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tFall = tag('自転車とぶつかって、プールに落ちる', { size: 46, w: 880, bg: '#14161c', sx: 1.95 }); qs.add(tFall);
const tFace = tag('助けてくれたのは、見覚えのある顔', { size: 48, w: 860, bg: '#e24050', sx: 1.9 }); qs.add(tFace);

// ---------- 2段目. 大学の陸上トラック（x=50）。朝のランニング。先頭を走る女子学生 ----------
const AX = 50;
const SKY2 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#8ac0e8', '#f0f4f4')); SKY2.position.set(AX, 12, -40); qs.add(SKY2);
{ const tr = box(30, 0.04, 6, mat('#c8584a')); tr.position.set(AX, 0.03, -4); qs.add(tr); for (let i = 0; i < 5; i++) { const ln = box(30, 0.02, 0.05, mat('#f0f0f0')); ln.position.set(AX, 0.06, -6.6 + i * 1.3); qs.add(ln); }
  const gr = box(30, 0.04, 8, mat('#6aa04a')); gr.position.set(AX, 0.02, -11); qs.add(gr);
  const st = box(20, 2.4, 2, mat('#a8a8b0')); st.position.set(AX, 1.2, -16); qs.add(st); }
const HER2 = person(HER, AX, -4.0, Math.PI / 2);
const RUN2 = ETC.map((o, i) => person(o, AX - 2.0 - i * 1.2, -4.6 + (i % 2) * 1.0, Math.PI / 2));
const tStudent = tag('主人公は、体育大学の女子学生', { size: 48, w: 820, bg: '#14161c', sx: 1.85 }); qs.add(tStudent);
const tStar = tag('練習では負けなしの、期待の星', { size: 48, w: 820, bg: '#e24050', sx: 1.85 }); qs.add(tStar);

// ---------- 3段目. 屋内の競技用プール（x=100）。スタート台の上でかたまる水泳部の青年 ----------
const BX = 100;
{ const fl = box(16, 0.3, 14, mat('#d8dce0')); fl.position.set(BX, 0.15, -4); qs.add(fl);
  const wl = box(16, 6, 0.3, mat('#e8ecf0')); wl.position.set(BX, 3, -12); qs.add(wl);
  for (let i = 0; i < 6; i++) { const wn = box(2, 2.2, 0.05, gl('#c8e0f0')); wn.position.set(BX - 6 + i * 2.4, 3.8, -11.8); qs.add(wn); }
  for (let i = 0; i < 6; i++) { const bl = box(0.6, 0.5, 0.6, mat('#e8e8e8')); bl.position.set(BX - 3 + i * 1.2, 0.55, -2.4); qs.add(bl); } }
const POOL3 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 7), waterMat()); POOL3.position.set(BX, 0.28, -6.2); qs.add(POOL3);
for (let i = 0; i < 5; i++) { const ln = box(0.06, 0.06, 7, mat(['#e84a3a', '#3a6ae8'][i % 2])); ln.position.set(BX - 2.4 + i * 1.2, 0.34, -6.2); qs.add(ln); }
const HIM3 = person({ ...HIM, shirt: '#f1c9a5' }, BX - 0.6, -2.4, Math.PI, 0.8);
const SWEAT3 = []; for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), gl('#a8d8ff')); qs.add(d); SWEAT3.push(d); }
const tCampus = tag('舞台は、スポーツ選手が集まる大学', { size: 46, w: 880, bg: '#14161c', sx: 1.95 }); qs.add(tCampus);
const tWeak = tag('彼は水泳部のエース、でも本番に弱い', { size: 44, w: 900, bg: '#e24050', sx: 2.0 }); qs.add(tWeak);

// ---------- 4段目. 夕方のキャンパスのベンチ前（x=150）。にやにやする青年と、むっとする主人公。むかしの小学校の思い出のボール ----------
const CX = 150;
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#e8a878', '#f8e0c0')); SKY4.position.set(CX, 12, -40); qs.add(SKY4);
{ const pv = box(30, 0.04, 14, mat('#c8c0b0')); pv.position.set(CX, 0.03, -4); qs.add(pv);
  const bn = box(1.8, 0.1, 0.5, mat('#8a6a44')); bn.position.set(CX - 1.6, 0.45, -5.4); qs.add(bn);
  for (let i = 0; i < 4; i++) { const tr = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), mat('#e8a040')); tr.position.set(CX - 6 + i * 4, 3, -9); qs.add(tr); const tk = box(0.25, 2.4, 0.25, mat('#6a4a3a')); tk.position.set(CX - 6 + i * 4, 1.2, -9); qs.add(tk); } }
const HER4 = person(HER, CX + 0.55, -3.6, -0.9);
const HIM4 = person(HIM, CX - 0.55, -3.6, 0.9);
const MARK4 = tag('！', { size: 90, w: 120, h: 120, bg: '#e24050', sx: 0.36 }); qs.add(MARK4);
const MEM4 = []; for (let i = 0; i < 2; i++) { const kid = person([{ ...HER, scale: 0.55 }, { ...HIM, scale: 0.55 }][i], CX - 0.3 + i * 0.6, -7, 0); kid.visible = false; MEM4.push(kid); }
const tClass = tag('彼は、小学校の同級生だった', { size: 50, w: 780, bg: '#14161c', sx: 1.85 }); qs.add(tClass);
const tTease = tag('昔のあだ名で、からかってくる', { size: 48, w: 820, bg: '#e24050', sx: 1.85 }); qs.add(tTease);

// ---------- 5段目. 夜の部屋のテレビ（x=200）。光る画面とソファ。金色のメダル ----------
const DX = 200;
{ const fl = box(12, 0.04, 10, mat('#3a3430')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(12, 5, 0.3, mat('#2a2a30')); wl.position.set(DX, 2.5, -6); qs.add(wl);
  const tvb = box(3.4, 0.5, 0.6, mat('#3a2e26')); tvb.position.set(DX, 0.25, -5.2); qs.add(tvb);
  const so = box(2.6, 0.5, 1.0, mat('#c86a7a')); so.position.set(DX, 0.35, 0.2); qs.add(so); const sb = box(2.6, 0.7, 0.24, mat('#c86a7a')); sb.position.set(DX, 0.85, 0.6); qs.add(sb); }
const TV5 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), new THREE.MeshBasicMaterial({ color: '#e8a0b0' })); TV5.position.set(DX, 1.6, -5.4); qs.add(TV5);
const TVL5 = new THREE.PointLight('#ffb8c8', 3, 9); TVL5.position.set(DX, 1.6, -4); qs.add(TVL5);
const MEDAL5 = new THREE.Group(); { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 28), new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.85, roughness: 0.25, emissive: '#4a3a10' })); d.rotation.x = Math.PI / 2; MEDAL5.add(d);
  for (const s of [-1, 1]) { const rb = box(0.12, 0.6, 0.02, mat(s < 0 ? '#e84a5a' : '#3a6ae8')); rb.position.set(s * 0.1, 0.5, 0); rb.rotation.z = s * 0.25; MEDAL5.add(rb); } }
MEDAL5.position.set(DX - 1.2, 1.4, -3.6); qs.add(MEDAL5);
const t2016 = tag('2016年の、韓国ドラマ', { size: 54, w: 660, bg: '#e6b450', color: '#14161c', sx: 1.65 }); qs.add(t2016);
const tRomcom = tag('大学スポーツの、青春ラブコメ', { size: 48, w: 820, bg: '#e24050', sx: 1.85 }); qs.add(tRomcom);

// ---------- 6段目. 体育館の練習場（x=250）。床のマットの上で、バーベルを持ち上げる主人公 ----------
const EX = 250;
{ const fl = box(14, 0.04, 12, mat('#c8a878')); fl.position.set(EX, 0.02, -3); qs.add(fl);
  const wl = box(14, 6, 0.3, mat('#e8e4dc')); wl.position.set(EX, 3, -8); qs.add(wl);
  for (let i = 0; i < 5; i++) { const wn = box(1.8, 1.4, 0.05, gl('#d8ecf8')); wn.position.set(EX - 5 + i * 2.5, 4.4, -7.8); qs.add(wn); }
  const pf = box(3, 0.1, 3, mat('#6a5040')); pf.position.set(EX, 0.07, -3.4); qs.add(pf);
  const lp = new THREE.PointLight('#fff4e0', 3, 12); lp.position.set(EX, 4, -2); qs.add(lp); }
const HER6 = person(HER, EX, -3.4, 0);
const BAR6 = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 10), new THREE.MeshStandardMaterial({ color: '#c8c8cc', metalness: 0.9, roughness: 0.2 })); b.rotation.z = Math.PI / 2; BAR6.add(b);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.42 - k * 0.06, 0.42 - k * 0.06, 0.07, 24), mat(['#d83a3a', '#3a6ae8', '#e8c040'][k])); pl.rotation.z = Math.PI / 2; pl.position.x = s * (0.78 + k * 0.08); BAR6.add(pl); } }
qs.add(BAR6);
const tLift = tag('彼女の競技は、重量挙げ', { size: 54, w: 680, bg: '#14161c', sx: 1.7 }); qs.add(tLift);
const tHarder = tag('バーベルより、恋のほうがむずかしい', { size: 46, w: 880, bg: '#e6b450', color: '#14161c', sx: 1.95 }); qs.add(tHarder);

// ---------- shots ----------
const ALL = [tFall, tFace, tStudent, tStar, tCampus, tWeak, tClass, tTease, t2016, tRomcom, tLift, tHarder, Q1, MARK4];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotPool(t, quiz = 0) { // 1段目 0〜9：自転車とぶつかって、プールに落ちる。助けてくれたのは、見覚えのある顔（0秒目がサムネ）
  base(); S.aim(0, -4); lift(0); S.hemi.intensity = 1.3; S.key.intensity = 1.5;
  HER1.position.y = -0.7 + Math.sin(t * 3) * 0.05; HER1.userData.arms.forEach((a, i) => a.rotation.x = -2.6 + Math.sin(t * 6 + i * 3) * 0.5);
  SPLASH1.forEach((d, i) => { const o = d.userData.o; const k = ((t * 0.9 + i * 0.07) % 1); d.position.set(-0.4 + Math.cos(o[0]) * o[1] * k, 0.4 + Math.sin(k * Math.PI) * 0.7, -4.4 + Math.sin(o[0]) * o[1] * k); });
  const reach = clamp((t - 4.8) / 0.8); HIM1.userData.arms[1].rotation.x = -1.6 * reach; HIM1.userData.head.rotation.x = 0.4 * reach;
  Q1.position.set(-0.3, 1.7, -4.6); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tFall, 1.05); pin(tFace, 1.05);
  if (!quiz) { tFall.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tFall.visible = false; tFace.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-1.9, -1.6, u), lerp(2.3, 2.2, u), lerp(1.4, 0.9, u), 0.45, 0.8, -3.6, 62);
  return qs;
}
function shotTrack(t) { // 2段目 9〜17：主人公は、体育大学の女子学生。練習では負けなしの、期待の星
  base(); S.aim(AX, -4); lift(0); S.hemi.intensity = 1.3; S.key.intensity = 1.5;
  HER2.position.x = AX - 1 + t * 0.7; poseWalk(HER2, t * 10, 1.1); RUN2.forEach((p, i) => { p.position.x = AX - 2.4 - i * 1.0 + t * 0.55; poseWalk(p, t * 10 + i, 1.0); });
  const u = ease(t / 8);
  look(HER2.position.x + 1.6, 1.6, -0.8, HER2.position.x - 0.6, 1.2, -4.2, 62);
  pin(tStudent, 1.05); pin(tStar, 1.05);
  tStudent.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tStudent.visible = false; tStar.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotSwim(t) { // 3段目 17〜25：舞台は、スポーツ選手が集まる大学。彼は水泳部のエース、でも本番に弱い
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = 1.2; S.key.intensity = 1.2;
  HIM3.userData.arms.forEach(a => a.rotation.x = t > 4.3 ? -0.4 + Math.sin(t * 14) * 0.08 : 0.3); HIM3.userData.head.rotation.x = t > 4.3 ? 0.35 : 0;
  SWEAT3.forEach((d, i) => { d.visible = t > 4.6; d.position.set(BX - 0.6 + (i - 1) * 0.28, 2.85 - ((t * 0.8 + i * 0.3) % 0.6), -2.25); });
  const u = ease(t / 8);
  look(BX + lerp(1.4, 1.0, u), lerp(2.2, 2.1, u), lerp(1.2, 0.4, u), BX - 0.6, 1.9, -2.6, 62);
  pin(tCampus, 1.05); pin(tWeak, 1.05);
  tCampus.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCampus.visible = false; tWeak.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotBench(t) { // 4段目 25〜33：彼は、小学校の同級生だった。昔のあだ名で、からかってくる
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 1.15; S.key.color.set('#ffc898');
  MEM4.forEach((k, i) => { k.visible = t < 4.0; k.position.set(CX - 0.3 + i * 0.6, 0, -5.2); poseWalk(k, t * 7 + i, 0.8); });
  HIM4.userData.arms[1].rotation.x = t > 4.4 ? -2.4 + Math.sin(t * 7) * 0.3 : 0; HIM4.userData.head.rotation.z = t > 4.4 ? 0.15 : 0;
  HER4.userData.arms.forEach(a => a.rotation.z = t > 5.0 ? 0 : 0); HER4.userData.arms.forEach((a, i) => a.rotation.x = t > 5.0 ? -0.5 : 0); HER4.rotation.y = t > 5.0 ? -1.4 : -0.9;
  MARK4.position.set(CX + 0.95, 2.05, -3.4); MARK4.userData.pop(clamp((t - 5.2) / 0.3));
  const u = ease(t / 8);
  look(CX + lerp(0.2, 0.1, u), lerp(1.7, 1.65, u), lerp(0.6, -0.2, u), CX, 1.4, -4.0, 62);
  pin(tClass, 1.05); pin(tTease, 1.05);
  tClass.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tClass.visible = false; tTease.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTV(t) { // 5段目 33〜42：2016年の、韓国ドラマ。大学スポーツの、青春ラブコメ
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.5; S.key.intensity = 0.3; S.darken(0.7, '#08040a');
  TV5.material.color.setHSL(0.96, 0.5, 0.62 + Math.sin(t * 2.6) * 0.06); MEDAL5.rotation.y = t * 1.4;
  const u = ease(t / 9);
  look(DX + lerp(-1.0, -0.4, u), lerp(2.0, 1.9, u), lerp(2.2, 1.4, u), DX - 0.6, 1.3, -4.4, 62);
  pin(t2016, 1.05); pin(tRomcom, 1.05);
  t2016.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2016.visible = false; tRomcom.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotLift(t) { // 6段目 42〜49（決め手）：彼女の競技は、重量挙げ。重たいバーベルより、恋のほうがむずかしい
  base(); S.aim(EX, -3); lift(0); S.hemi.intensity = 1.2; S.key.intensity = 1.2;
  const up = ease(clamp((t - 0.6) / 1.6));
  const a = HER6.userData.arms; a.forEach(x => { x.rotation.x = lerp(-1.2, -3.1, up); x.rotation.z = 0; });
  HER6.userData.legs.forEach((l, i) => l.rotation.z = (i ? -1 : 1) * 0.15);
  BAR6.position.set(EX, lerp(1.25, 2.58, up), -3.4 + lerp(0.36, 0.0, up));
  const u = ease(t / 7);
  look(EX + lerp(1.3, 1.0, u), lerp(1.45, 1.5, u), lerp(2.8, 2.3, u), EX, 1.75, -3.4, 62);
  pin(tLift, 1.05); pin(tHarder, 1.05);
  if (t < 3.6) tLift.userData.pop((t - 0.3) / 0.35); else tHarder.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（屋外プールに戻る）
  shotPool(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotPool(t, 0) },
  { a: 9, b: 17, f: shotTrack },
  { a: 17, b: 25, f: shotSwim },
  { a: 25, b: 33, f: shotBench },
  { a: 33, b: 42, f: shotTV },
  { a: 42, b: 49, f: shotLift },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '自転車とぶつかって、<br>プールに落ちる。'],
  [5.6, 9.0, '助けてくれたのは、<br>見覚えのある顔。'],
  [9.2, 13.2, '主人公は、<br>体育大学の女子学生。'],
  [13.2, 17.0, '練習では負けなしの、<br>期待の星。'],
  [17.2, 21.0, '舞台は、スポーツ選手が<br>集まる大学。'],
  [21.0, 25.0, '彼は水泳部のエース。<br>でも、本番に弱い。'],
  [25.2, 29.0, '彼は、小学校の<br>同級生だった。'],
  [29.0, 33.0, '昔のあだ名で、<br>からかってくる。'],
  [33.2, 37.4, '2016年の、<br>韓国ドラマ。'],
  [37.4, 41.8, '大学スポーツの、<br>青春ラブコメ。'],
  [42.2, 45.4, '彼女の競技は、<br>重量挙げ。'],
  [45.4, 49.0, 'バーベルより、<br>恋のほうがむずかしい。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>恋のゴールドメダル。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q144', v2: true, answer: '恋のゴールドメダル～僕が恋したキム・ボクジュ～',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'hopeful', seed: 14410,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [2.4, 'bubble'], [5.6, 'bubble'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [30.2, 'bubble'], [33.0, 'whoosh'], [42.0, 'whoosh'], [43.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '恋のゴールドメダル': 'こいのゴールドメダル', 'スポーツ選手': 'スポーツせんしゅ', '助けてくれた': 'たすけてくれた', '2016年': 'にせんじゅうろくねん', '韓国ドラマ': 'かんこくドラマ', '体育大学': 'たいいくだいがく', '女子学生': 'じょしがくせい', '負けなし': 'まけなし', '重量挙げ': 'じゅうりょうあげ', '聞かせて': 'きかせて', '見覚え': 'みおぼえ', '自転車': 'じてんしゃ', '主人公': 'しゅじんこう', '水泳部': 'すいえいぶ', '小学校': 'しょうがっこう', '同級生': 'どうきゅうせい', '集まる': 'あつまる', '落ちる': 'おちる', '当てて': 'あてて', '練習': 'れんしゅう', '期待': 'きたい', '舞台': 'ぶたい', '大学': 'だいがく', '本番': 'ほんばん', '弱い': 'よわい', '青春': 'せいしゅん', '彼女': 'かのじょ', '競技': 'きょうぎ', '間に': 'あいだに', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '顔': 'かお', '星': 'ほし', '彼': 'かれ', '昔': 'むかし', '恋': 'こい' },
    caption: 'このドラマのタイトル、わかる？\n自転車とぶつかって、プールに落ちる。助けてくれたのは、見覚えのある顔。主人公は、体育大学の女子学生。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'FOD', 'U-NEXT', '韓国ドラマ', '韓ドラ'],
  },
});
applyQuizCards({ answer: '恋のゴールドメダル<span style="display:block;font-size:46px;margin-top:14px">～僕が恋したキム・ボクジュ～</span>', info: 'FOD・U-NEXT｜韓国ドラマ', answerSize: 96 });
