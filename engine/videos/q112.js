import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #112 ターミネーター2（映画・アメリカ・1991年・137分。U-NEXT で見放題、
//   U-NEXT の作品ページ video.unext.jp/title/SID0054069（見放題の札）と Filmarks の動画配信欄（U-NEXT 見放題）で2026/11/19確認。
//   Filmarks 4.1・レビュー112,189件 filmarks.com/movies/33388）
// 確かめた事実（Filmarks のあらすじ filmarks.com/movies/33388、Wikipedia 日本語版 ターミネーター2 の 冒頭・興行収入。2026/11/19）：
//   ・少年は、近未来に人類抵抗軍のリーダーになる。機械軍は彼を少年のうちに殺すため、新しい刺客を送り込む（Filmarks）
//   ・ある日、未来から2体が送り込まれる。息子を守るために、母の死闘が始まる。強い味方が現れる。人類抵抗軍が送り込んだ戦士で、
//     いかなる犠牲を払っても少年を守れと命じられている（Filmarks）
//   ・1991年のアメリカの SF アクション映画。監督 ジェームズ・キャメロン。出演 アーノルド・シュワルツェネッガーほか。前作から約7年を経て公開された続編（Wikipedia）
//   ・コンピュータで作られたキャラクターに初めて人間の自然な動きを使うなど、CG の中で画期的だった（Wikipedia）。世界興行収入 5億2,088万ドル（Wikipedia）
// 構成（ヒント6段）：1 未来から2人の男が送りこまれた・ねらいはひとりの少年 → 2 少年は未来で人類のリーダーになる・だから子どものうちにねらわれた
//   → 3 未来では人間と機械が戦っている・機械の軍が刺客を送った → 4 母は息子を守るために戦う・少年を守る強い味方
//   → 5 1991年のアメリカ映画・監督はジェームズ・キャメロン・CGで映画の歴史を変えた → 6 決め手：主演はシュワルツェネッガー・7年ぶりの続編、タイトルに数字
// 2人のうちどちらが味方か・刺客の正体や能力・結末は言わない。登場人物の名前・地名は出さない。
// 俳優の顔・ポスター・ロゴ・劇中の有名な場面の構図（光の球からの登場・サングラス・バイクの追跡・金属の骨格など）は使わない。人は汎用の3D
const S = quizStage({ bg: '#10141c', floor: '#22262e', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(11210);

const MANA = { skin: '#e0b08a', hair: '#3a2a20', shirt: '#2a2a2e', pants: '#2a2a32', scale: 1.12 };
const MANB = { skin: '#f1c9a5', hair: '#c8a878', shirt: '#5a6a7a', pants: '#3a4050' };
const BOY = { skin: '#f4d3b5', hair: '#5a3a24', shirt: '#9a3a3a', pants: '#4a5a7a', scale: 0.72 };
const MOM = { skin: '#f1c9a5', hair: '#3a2a20', shirt: '#4a5a3a', pants: '#3a3a40', long: true };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function robot() { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: '#5a5e68', metalness: 0.7, roughness: 0.4 });
  const b = box(0.7, 0.9, 0.4, m); b.position.y = 1.5; g.add(b); const h = box(0.42, 0.36, 0.38, m); h.position.y = 2.15; g.add(h);
  const v = box(0.34, 0.07, 0.02, gl('#ff2a2a')); v.position.set(0, 2.17, 0.2); g.add(v);
  for (const s of [-1, 1]) { const l = box(0.2, 1.0, 0.22, m); l.position.set(s * 0.2, 0.5, 0); g.add(l); const a = box(0.16, 0.85, 0.18, m); a.position.set(s * 0.46, 1.45, 0); g.add(a); }
  qs.add(g); return g; }

// ---------- 1段目. 真夜中の路地（x=0）。ぬれた地面、青い火花の名残。離れて立つ2人の男 ----------
{ const gr = box(20, 0.04, 16, mat('#1a1e26')); gr.position.set(0, 0.02, -4); qs.add(gr);
  for (const s of [-1, 1]) { const w = box(0.4, 6, 16, mat('#2a2e38')); w.position.set(s * 4.2, 3, -4); qs.add(w);
    for (let i = 0; i < 5; i++) { const wn = box(0.05, 0.8, 1.2, gl(i % 2 ? '#3a4050' : '#d8b870')); wn.position.set(s * 3.98, 2.6 + (i % 2) * 1.6, -1 - i * 2.4); qs.add(wn); } }
  const neon = box(0.06, 0.5, 2.0, gl('#ff4a8a')); neon.position.set(-3.96, 3.6, -6); qs.add(neon);
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.6, 6, 16, 1, true), gl('#c8d8ff', 0.08)); lamp.position.set(0, 3, -8); qs.add(lamp);
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.3 + R() * 0.5, 16), gl('#3a4a6a', 0.6)); p.rotation.x = -Math.PI / 2; p.position.set(R() * 6 - 3, 0.05, -1 - R() * 8); qs.add(p); } }
const manA1 = makePerson(MANA); manA1.position.set(-1.4, 0, -6.5); qs.add(manA1);
const manB1 = makePerson(MANB); manB1.position.set(0.95, 0, -4.4); manB1.rotation.y = -0.4; qs.add(manB1);
const SP1 = []; for (let i = 0; i < 30; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.18), gl('#7ac8ff')); s.userData.p = [i % 2, R() * Math.PI * 2, R() * 1.4, R()]; qs.add(s); SP1.push(s); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.5 }); qs.add(Q1);
const tFuture = tag('未来から、2人の男', { size: 58, w: 580, bg: '#14161c', sx: 2.0 }); tFuture.position.set(0, 2.6, -5.6); qs.add(tFuture);
const tTarget = tag('ねらいは、ひとりの少年', { size: 54, w: 680, bg: '#c8202c', sx: 2.2 }); tTarget.position.set(0, 2.6, -5.6); qs.add(tTarget);

// ---------- 2段目. 昼の住宅街（x=50）。家の前の段に座る少年。そのうしろに、未来の姿の光の板 ----------
const AX = 50;
{ const gr = box(20, 0.04, 14, mat('#8a9a6a')); gr.position.set(AX, 0.02, -4); qs.add(gr);
  const hs = box(6, 3.2, 4, mat('#d8ccb8')); hs.position.set(AX, 1.6, -8); qs.add(hs);
  const rf = new THREE.Mesh(new THREE.ConeGeometry(4.6, 1.6, 4), mat('#6a5a50')); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, 0.65); rf.position.set(AX, 4.0, -8); qs.add(rf);
  const dr = box(1.0, 2.0, 0.05, mat('#7a5a40')); dr.position.set(AX, 1.0, -5.97); qs.add(dr);
  for (let i = 0; i < 3; i++) { const st = box(1.8, 0.18, 0.4, mat('#b8b0a0')); st.position.set(AX, 0.09 + i * 0.18, -5.0 - i * 0.35); qs.add(st); }
  for (let i = 0; i < 3; i++) { const tr = new THREE.Mesh(new THREE.SphereGeometry(1.0 + i * 0.2, 12, 8), mat('#4a7a3a')); tr.position.set(AX + (i - 1) * 6 + 1, 2.6, -11); qs.add(tr); } }
const sky2 = new THREE.Mesh(new THREE.PlaneGeometry(49, 50), new THREE.MeshBasicMaterial({ fog: false, color: '#9ac0e0' })); sky2.position.set(AX, 14, -40); qs.add(sky2);
const boy2 = makePerson(BOY); boy2.position.set(AX, 0.36, -5.1); qs.add(boy2);
const HOLO2 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.6), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(220, 260, (g, w, h) => {
  g.fillStyle = 'rgba(80,180,255,0.18)'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,210,255,0.9)'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
  g.fillStyle = 'rgba(160,230,255,0.9)'; g.beginPath(); g.arc(110, 70, 26, 0, 7); g.fill(); g.fillRect(78, 98, 64, 90); g.fillRect(84, 186, 22, 60); g.fillRect(114, 186, 22, 60);
  g.fillRect(142, 104, 18, 70); g.fillRect(60, 100, 18, 40); g.fillRect(40, 70, 26, 18);
  g.fillStyle = 'rgba(160,230,255,0.5)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(30 + i * 34, 240, 10, 0, 7); g.fill(); g.fillRect(22 + i * 34, 248, 16, 12); } }) }));
HOLO2.position.set(AX + 1.6, 2.6, -5.6); qs.add(HOLO2);
const tLeader = tag('未来の、人類のリーダー', { size: 54, w: 680, bg: '#14161c', sx: 1.9 }); tLeader.position.set(AX + 0.3, 3.0, -5.4); qs.add(tLeader);
const tKid = tag('子どものうちに、ねらわれる', { size: 52, w: 760, bg: '#c8202c', sx: 2.1 }); tKid.position.set(AX + 0.3, 3.0, -5.4); qs.add(tKid);

// ---------- 3段目. 未来の夜の戦場（x=100）。崩れたビル、サーチライト、赤い目の機械の兵隊の列 ----------
const BX = 100;
{ const gr = box(40, 0.04, 30, mat('#2a2622')); gr.position.set(BX, 0.02, -10); qs.add(gr);
  for (let i = 0; i < 9; i++) { const h = 3 + R() * 7; const b = box(3, h, 3, mat('#2e2a30')); b.position.set(BX - 16 + i * 4, h / 2, -20 - (i % 2) * 4); b.rotation.z = (R() - 0.5) * 0.15; qs.add(b); }
  for (let i = 0; i < 20; i++) { const d = box(0.4 + R() * 0.8, 0.3 + R() * 0.5, 0.4 + R() * 0.8, mat('#3a3430')); d.position.set(BX - 8 + R() * 16, 0.2, -2 - R() * 12); d.rotation.y = R() * 3; qs.add(d); } }
const SKY3 = new THREE.Mesh(new THREE.PlaneGeometry(49, 50), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a0a14'); gr.addColorStop(1, '#4a2a2a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) })); SKY3.position.set(BX, 14, -40.02); qs.add(SKY3);
const BEAM3 = [-1, 1].map(s => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1.6, 22, 12, 1, true), gl('#e8f0ff', 0.12)); b.position.set(BX + s * 5, 9, -18); qs.add(b); return b; });
const BOTS3 = []; for (let i = 0; i < 7; i++) { const r = robot(); r.position.set(BX - 4.5 + i * 1.5, 0, -8 - (i % 2) * 1.2); BOTS3.push(r); }
const tWar = tag('未来は、人間と機械の戦い', { size: 52, w: 760, bg: '#14161c', sx: 4.2 }); tWar.position.set(BX, 4.6, -8); qs.add(tWar);
const tSent = tag('機械の軍が、刺客を送った', { size: 52, w: 760, bg: '#c8202c', sx: 4.2 }); tSent.position.set(BX, 4.6, -8); qs.add(tSent);

// ---------- 4段目. 夕暮れの荒れ地のガソリンスタンド（x=150）。母が少年の手を引く。前に立つ大きな男 ----------
const CX = 150;
{ const gr = box(40, 0.04, 30, mat('#b89a70')); gr.position.set(CX, 0.02, -10); qs.add(gr);
  const rd = box(5, 0.05, 30, mat('#4a4a4a')); rd.position.set(CX - 6, 0.03, -10); qs.add(rd);
  const cv = box(8, 0.25, 4, mat('#d8d0c0')); cv.position.set(CX + 1, 3.4, -7); qs.add(cv);
  for (const x of [-2.6, 4.6]) { const p = box(0.25, 3.4, 0.25, mat('#c8c0b0')); p.position.set(CX + x, 1.7, -7); qs.add(p); }
  const pump = box(0.6, 1.4, 0.4, mat('#c83a3a')); pump.position.set(CX + 1, 0.7, -7); qs.add(pump);
  const shop = box(5, 2.8, 3, mat('#e8dcc8')); shop.position.set(CX + 4, 1.4, -11); qs.add(shop);
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(5 + i * 2, 3 + i, 4), mat('#a87a58')); m.position.set(CX - 14 + i * 10, 1.4, -28); qs.add(m); } }
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(49, 50), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a3a6a'); gr.addColorStop(1, '#f09060'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) })); SKY4.position.set(CX, 14, -40.04); qs.add(SKY4);
const mom4 = makePerson(MOM); mom4.position.set(CX - 0.4, 0, -4.4); qs.add(mom4);
const boy4 = makePerson(BOY); boy4.position.set(CX + 0.3, 0, -4.6); qs.add(boy4);
const man4 = makePerson(MANA); man4.position.set(CX - 1.6, 0, -2.6); man4.rotation.y = Math.PI * 0.8; qs.add(man4);
const tMom = tag('息子を守る、母の戦い', { size: 56, w: 640, bg: '#14161c', sx: 2.4 }); tMom.position.set(CX - 0.4, 3.0, -4.6); qs.add(tMom);
const tAlly = tag('そこへ、強い味方', { size: 60, w: 540, bg: '#2a7ad8', sx: 2.2 }); tAlly.position.set(CX - 0.4, 3.0, -4.6); qs.add(tAlly);

// ---------- 5段目. 映画館（x=200）。スクリーンに、光の線で組み立てた街。CG の格子 ----------
const TX = 200;
{ const fl = box(14, 0.04, 14, mat('#1e1a22')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#2a2230')); wl.position.set(TX, 4, -5); qs.add(wl);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const s = box(0.7, 0.8, 0.6, mat('#5a1a2a')); s.position.set(TX - 2.9 + i * 1.15, 0.4 + r * 0.25, 2.4 + r * 1.1); qs.add(s); } }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(720, 360, (g, w, h) => {
  g.fillStyle = '#04080e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2ac8ff'; g.lineWidth = 2;
  for (let i = 0; i <= 18; i++) { g.beginPath(); g.moveTo(360, 170); g.lineTo(i * 40, h); g.stroke(); }
  for (let k = 0; k < 8; k++) { const y = 180 + k * k * 3.2; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.strokeStyle = '#7ae0ff'; [[80, 90, 60], [170, 60, 50], [480, 70, 70], [590, 110, 50], [280, 120, 40]].forEach(([x, hgt, wd]) => { g.strokeRect(x, 170 - hgt, wd, hgt); }); }) }));
SCR5.position.set(TX, 3.6, -4.85); qs.add(SCR5);
const t1991 = tag('1991年の、アメリカ映画', { size: 56, w: 680, bg: '#e6b450', color: '#14161c', sx: 4.6 }); t1991.position.set(TX, 6.4, -4.4); qs.add(t1991);
const tCG = tag('CGで、映画の歴史を変えた', { size: 54, w: 760, bg: '#2a7ad8', sx: 4.8 }); tCG.position.set(TX, 6.4, -4.4); qs.add(tCG);

// ---------- 6段目. 暗い工場（x=250）。赤い火の粉の中に、金属の大きな数字 ----------
const DX = 250;
{ const fl = box(14, 0.04, 12, mat('#2a2420')); fl.position.set(DX, 0.02, -3); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#3a3030')); wl.position.set(DX, 4, -8); qs.add(wl);
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 7, 12), mat('#4a3a34')); c.position.set(DX - 5 + i * 3.4, 3.5, -6); qs.add(c); }
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), gl('#ff6a2a', 0.25)); glow.position.set(DX, 1.2, -7.8); qs.add(glow); }
const TWO6 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.4), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(260, 340, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f4f8ff'); gr.addColorStop(0.45, '#8a96a8'); gr.addColorStop(0.55, '#dce4f0'); gr.addColorStop(1, '#4a5260');
  g.font = '900 330px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.strokeStyle = '#1a1e26'; g.strokeText('2', 130, 182); g.fillStyle = gr; g.fillText('2', 130, 182); }) }));
TWO6.position.set(DX, 2.4, -4.5); qs.add(TWO6);
const EMB6 = []; for (let i = 0; i < 40; i++) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), gl(i % 3 ? '#ff8a3a' : '#ffd060')); e.userData.p = [R() * 8 - 4, R() * 5, R() * 3 - 5, R()]; qs.add(e); EMB6.push(e); }
const tStar = tag('主演、シュワルツェネッガー', { size: 54, w: 760, bg: '#14161c', sx: 2.6 }); tStar.position.set(DX, 4.5, -4.4); qs.add(tStar);
const tSeq = tag('7年ぶりの、続編', { size: 60, w: 540, bg: '#c8202c', sx: 2.2 }); tSeq.position.set(DX, 4.5, -4.4); qs.add(tSeq);

// ---------- shots ----------
const ALL = [tFuture, tTarget, tLeader, tKid, tWar, tSent, tMom, tAlly, t1991, tCG, tStar, tSeq, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SP1.forEach(s => s.visible = false); }

function shotAlley(t, quiz = 0) { // 1段目 0〜9：未来から、2人の男が送りこまれた。ねらいは、ひとりの少年（0秒目がサムネ）
  base(); S.aim(0, -5); lift(0); S.hemi.intensity = 0.8; S.darken(0.15, '#04060c');
  const fade = quiz ? 0.4 : clamp(1 - t / 6);
  SP1.forEach((s, i) => { const p = s.userData.p; const c = p[0] ? manB1.position : manA1.position; const k = (t * 0.8 + p[3]) % 1; s.visible = fade > 0.02;
    s.position.set(c.x + Math.cos(p[1]) * (0.5 + k * p[2]), 0.1 + k * 1.8, c.z + Math.sin(p[1]) * (0.5 + k * p[2])); s.rotation.set(p[1], p[1] * 2, 0); s.scale.setScalar(fade); });
  manA1.rotation.y = 0.35; manA1.userData.head.rotation.y = Math.sin(t * 0.7) * 0.3;
  manB1.userData.head.rotation.y = -Math.sin(t * 0.9) * 0.3;
  Q1.position.set(0.1, 1.6, -5.0); Q1.userData.pop(1); if (!quiz && t > 4.5) Q1.visible = false;
  if (!quiz) { tFuture.userData.pop((t - 1.8) / 0.35); if (t > 4.6) tFuture.visible = false; tTarget.userData.pop((t - 4.8) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.0, -0.1, u), lerp(1.9, 1.8, u), lerp(0.6, -0.4, u), -0.1, 1.3, -5.4, 64);
  return qs;
}
function shotHome(t) { // 2段目 9〜17：その少年は、未来で人類のリーダーになる。だから子どものうちにねらわれた
  base(); S.aim(AX, -5); lift(0); S.hemi.intensity = 1.3;
  boy2.userData.legs.forEach(l => l.rotation.x = -1.4); boy2.position.y = 0.36 - 0.25 * 0.72; boy2.userData.arms.forEach(a => a.rotation.x = -0.7);
  const hk = ease(clamp((t - 0.6) / 0.6)); HOLO2.material.opacity = hk * (0.85 + Math.sin(t * 9) * 0.1); HOLO2.scale.set(1, hk, 1);
  boy2.userData.head.rotation.y = t > 4.2 ? 0.4 : 0;
  tLeader.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tLeader.visible = false; tKid.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(-0.8, -0.4, u), lerp(1.6, 1.7, u), lerp(-0.4, -1.4, u), AX + 0.5, 1.6, -5.4, 62);
  return qs;
}
function shotWar(t) { // 3段目 17〜25：未来では、人間と機械が戦っている。機械の軍が、新しい刺客を送った
  base(); S.aim(BX, -8); lift(0); S.hemi.intensity = 0.35; S.darken(0.5, '#0a0408');
  BEAM3.forEach((b, i) => { b.rotation.z = Math.sin(t * 0.6 + i * 2) * 0.35; });
  BOTS3.forEach((r, i) => { const w = t * 0.35; r.position.z = -8 - (i % 2) * 1.2 + w; r.children.forEach((c, k) => { if (k >= 3 && k < 11 && c.geometry.parameters.height === 1.0) c.rotation.x = Math.sin(t * 4 + i + k) * 0.3; }); });
  tWar.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWar.visible = false; tSent.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.8, 0.2, u), lerp(1.2, 1.4, u), lerp(1.0, -0.6, u), BX, 2.4, -8, 64);
  return qs;
}
function shotStation(t) { // 4段目 25〜33：母は息子を守るために戦う。そこへ、少年を守る強い味方
  base(); S.aim(CX, -5); lift(0); S.hemi.intensity = 1.0; S.darken(0.2, '#f09060');
  mom4.rotation.y = t < 4 ? -0.4 : 0.6; mom4.userData.arms[1].rotation.x = -0.9; mom4.userData.arms[1].rotation.z = -0.3;
  boy4.rotation.y = t < 4 ? -0.6 : 0.5; boy4.userData.arms[0].rotation.x = -0.6;
  const w = ease(clamp((t - 3.9) / 1.6)); man4.visible = t > 3.9; man4.position.set(CX - 3.6 + w * 2.0, 0, -2.4 - w * 0.6); poseWalk(man4, t * 6, w > 0 && w < 1 ? 0.7 : 0); man4.rotation.y = lerp(1.3, 0.9, w);
  tMom.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tMom.visible = false; tAlly.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(1.4, 1.0, u), lerp(2.0, 1.9, u), lerp(1.8, 1.0, u), CX - 0.6, 1.5, -4.4, 62);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：1991年のアメリカ映画。監督はジェームズ・キャメロン。CGで映画の歴史を変えた
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.5; S.darken(0.6, '#08060a');
  t1991.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t1991.visible = false; tCG.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 3.0, u), lerp(6.8, 6.0, u), TX, 3.6, -4.8, 68);
  return qs;
}
function shotTwo(t) { // 6段目 42〜49（決め手）：主演はアーノルド・シュワルツェネッガー。7年ぶりの続編、タイトルには数字が
  base(); S.aim(DX, -4); lift(0); S.hemi.intensity = 0.5; S.darken(0.6, '#140604');
  const k = ease(clamp((t - 3.6) / 0.6)); TWO6.visible = k > 0; TWO6.scale.setScalar(0.4 + 0.6 * k); TWO6.rotation.y = Math.sin(t * 0.8) * 0.15;
  EMB6.forEach((e, i) => { const p = e.userData.p; const y = (p[1] + t * (0.6 + p[3])) % 5; e.position.set(DX + p[0] + Math.sin(t + i) * 0.2, y, p[2]); });
  if (t < 3.6) tStar.userData.pop((t - 0.3) / 0.35); else tSeq.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.4, 0.1, u), lerp(2.3, 2.4, u), lerp(2.6, 1.6, u), DX, 2.6, -4.5, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（真夜中の路地に戻る）
  shotAlley(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotAlley(t, 0) },
  { a: 9, b: 17, f: shotHome },
  { a: 17, b: 25, f: shotWar },
  { a: 25, b: 33, f: shotStation },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotTwo },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, 'ある夜、未来から<br>2人の男が送りこまれた。'],
  [5.6, 9.0, 'ねらいは、<br>ひとりの少年。'],
  [9.2, 13.2, 'その少年は、未来で<br>人類のリーダーになる。'],
  [13.2, 17.0, 'だから、子どものうちに<br>ねらわれた。'],
  [17.2, 21.0, '未来では、人間と<br>機械が戦っている。'],
  [21.0, 25.0, '機械の軍が、<br>新しい刺客を送った。'],
  [25.2, 29.0, '母は、息子を守るために<br>戦いはじめる。'],
  [29.0, 33.0, 'そこへ現れた、<br>少年を守る強い味方。'],
  [33.2, 37.4, '1991年のアメリカ映画。<br>監督はジェームズ・キャメロン。'],
  [37.4, 41.8, 'CGの映像で、<br>映画の歴史を変えた。'],
  [42.2, 45.4, '主演は、アーノルド・<br>シュワルツェネッガー。'],
  [45.4, 49.0, '7年ぶりの続編。<br>タイトルには、数字が。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ターミネーター2。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q112', v2: true, answer: 'ターミネーター2',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 11210,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ターミネーター2': 'ターミネーターツー', '夜': 'よる', '未来': 'みらい', '2人': 'ふたり', '男': 'おとこ', '送りこまれた': 'おくりこまれた', 'ひとり': 'ひとり', '少年': 'しょうねん', '人類': 'じんるい', '子ども': 'こども', '人間': 'にんげん', '機械': 'きかい', '戦っている': 'たたかっている', '軍': 'ぐん', '新しい': 'あたらしい', '刺客': 'しかく', '送った': 'おくった', '母': 'はは', '息子': 'むすこ', '守る': 'まもる', '戦い': 'たたかい', '現れた': 'あらわれた', '強い': 'つよい', '味方': 'みかた', '1991年': 'せんきゅうひゃくきゅうじゅういちねん', '映画': 'えいが', '監督': 'かんとく', 'CG': 'シージー', '映像': 'えいぞう', '歴史': 'れきし', '変えた': 'かえた', '主演': 'しゅえん', '7年ぶり': 'ななねんぶり', '続編': 'ぞくへん', '数字': 'すうじ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\nある夜、未来から2人の男が送りこまれた。ねらいは、ひとりの少年。その少年は、未来で人類のリーダーになる。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', '洋画', '映画好き', 'SF映画'],
  },
});
applyQuizCards({ answer: 'ターミネーター2', info: 'U-NEXT｜映画・137分', answerSize: 112 });
