import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards, makeDisc, makeBars, SONG_GREEN } from './quiz-kit.js';

// タイトル当てクイズ #120 マリーゴールド（曲・あいみょん・2018年）。曲の回（docs/QUIZ.md の 曲のクイズ）
// 確かめた事実（2026/11/21）：
//   ・あいみょんのシングル表題曲。2018年7月18日に配信で先行リリース、CD は 2018年8月8日（ナタリーの記事 lp.p.pia.jp/article/news/4058/index.html、
//     OTOTOY の配信ページ ototoy.jp/_/default/p/128068 のリリース日 2018-07-18・レーベル WM Japan unBORDE）
//   ・日本レコード協会のストリーミング認定 ダイヤモンド（5億回以上。2023年12月度。riaj.or.jp/data/st/search/ で「マリーゴールド」、メーカー ワーナーミュージック・ジャパン）
// 物語：曲が描く状況（暑い季節に大好きな人と並んで歩く → この時間がずっと続けばいいと思う → まぶしい日差しの帰り道
//   → この人を大切にしたいというまっすぐな気持ち → となりの人をオレンジ色の花にたとえる）を自分の言葉で作り直したもの。
//   歌詞の言葉・言い回しは使わない（tools/lyric-check.py で歌詞と見比べて、重なる言葉が曲名と文法の切れ端だけなのを確かめた）。
//   歌詞に出てくる小物（帽子など）は字幕・札・3D・カバーに出さない。音源・ジャケット・MV の映像や設定（街並み・スケートボードなど）・歌手の見た目は使わない。人は汎用の3D
// 構成（ヒント6段）：1 暑い日の午後、となりを歩く大好きな人・ふいにその笑顔に見とれる → 2 主人公は恋をしているひとり・この時間がつづけばいい
//   → 3 セミの声とまぶしい日差し・並んで歩くいつもの帰り道 → 4 この人を何があっても大切にしたい・まっすぐな気持ちがあふれる
//   → 5 2018年に出たシンガーソングライターの曲・ストリーミング5億回 → 6 決め手：となりの人をオレンジ色の花にたとえた・タイトルはその花の名前、カタカナ7文字
const S = quizStage({ bg: '#8ab8e0', floor: '#7a9a5a', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(12010);

const ME = { skin: '#f1c9a5', hair: '#3a2418', shirt: '#f4f0e6', pants: '#5a6a8a' };
const YOU = { skin: '#f4d3b5', hair: '#2a1a14', shirt: '#f0a040', pants: '#e8e0d0', long: true, skirt: true };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
const skyTex = (a, b) => new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
function tree(x, z, s = 1) { const g = new THREE.Group(); const tr = box(0.3, 1.6, 0.3, mat('#6a4a30')); tr.position.y = 0.8; g.add(tr);
  const lf = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), mat('#3a8a3a')); lf.position.y = 2.3; g.add(lf); g.position.set(x, 0, z); g.scale.setScalar(s); qs.add(g); return g; }
// オレンジ色のまるい花（6段目）
function flower(x, z, s = 1) { const g = new THREE.Group(); const st = box(0.04, 0.5, 0.04, mat('#3a7a3a')); st.position.y = 0.25; g.add(st);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat(R() < 0.5 ? '#f08a20' : '#f8b030')); hd.scale.set(1, 0.7, 1); hd.position.y = 0.55; g.add(hd);
  for (let i = 0; i < 2; i++) { const lf = box(0.2, 0.02, 0.08, mat('#4a8a3a')); lf.position.set(i ? 0.08 : -0.08, 0.2, 0); lf.rotation.z = i ? -0.5 : 0.5; g.add(lf); }
  g.position.set(x, 0, z); g.scale.setScalar(s); qs.add(g); return g; }

// ---------- 1段目. 暑い日の午後の並木道（x=0）。並んで歩くふたり。ふと となりを見る主人公 ----------
{ const rd = box(6, 0.04, 30, mat('#c8b890')); rd.position.set(0, 0.03, -6); qs.add(rd);
  for (let i = 0; i < 6; i++) { tree(-4, -2 - i * 4, 1.1); tree(4, -4 - i * 4, 1.0); }
  const fn = box(0.1, 0.8, 30, mat('#e8e0d0')); fn.position.set(-2.8, 0.4, -6); qs.add(fn); }
const SKY1 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#5aa0e8', '#d8ecf8')); SKY1.position.set(0, 12, -40); qs.add(SKY1);
const me1 = makePerson(ME); me1.position.set(-0.45, 0, -2); qs.add(me1);
const you1 = makePerson(YOU); you1.position.set(0.45, 0, -2); qs.add(you1);
const HEART1 = []; for (let i = 0; i < 6; i++) { const h = tag('♥', { size: 90, w: 120, h: 120, bg: 'rgba(0,0,0,0)', color: '#ff7aa0', sx: 0.3 }); h.userData.p = [R(), R()]; qs.add(h); HEART1.push(h); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: SONG_GREEN, sx: 0.5 }); qs.add(Q1);
const tLove = tag('となりには、恋人', { size: 58, w: 520, bg: '#14161c', sx: 1.9 }); tLove.position.set(0, 2.9, -2.6); qs.add(tLove);
const tSmile = tag('その笑顔に、見とれた', { size: 56, w: 640, bg: SONG_GREEN, sx: 2.2 }); tSmile.position.set(0, 2.9, -2.6); qs.add(tSmile);

// ---------- 2段目. 公園のベンチ（x=50）。ならんで座るふたり。ゆっくり動く雲の影と、光のつぶ ----------
const AX = 50;
{ const gr = box(16, 0.04, 12, mat('#7aa85a')); gr.position.set(AX, 0.02, -2); qs.add(gr);
  const bn = box(2.4, 0.12, 0.6, mat('#a87a4a')); bn.position.set(AX, 0.5, -3); qs.add(bn);
  const bk = box(2.4, 0.5, 0.08, mat('#a87a4a')); bk.position.set(AX, 0.85, -3.3); qs.add(bk);
  for (const s of [-1, 1]) { const l = box(0.1, 0.5, 0.5, mat('#3a3a3a')); l.position.set(AX + s * 1.1, 0.25, -3); qs.add(l); }
  tree(AX - 3.6, -5, 1.2); tree(AX + 3.8, -6, 1.3); tree(AX + 0.4, -8, 1.4);
  const ft = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.5, 20), mat('#b8b0a0')); ft.position.set(AX - 4.4, 0.25, 0.6); qs.add(ft); }
const SKY2 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#5aa0e8', '#e8f4fa')); SKY2.position.set(AX, 12, -40); qs.add(SKY2);
const me2 = makePerson(ME); me2.position.set(AX - 0.45, 0.06, -3); qs.add(me2);
const you2 = makePerson(YOU); you2.position.set(AX + 0.45, 0.06, -3); qs.add(you2);
const SPARK2 = []; for (let i = 0; i < 16; i++) { const s = box(0.05, 0.05, 0.05, gl('#fff6c0')); s.userData.p = [R(), R(), R()]; qs.add(s); SPARK2.push(s); }
const tOne = tag('恋をしている、ひとり', { size: 56, w: 620, bg: '#14161c', sx: 2.4 }); tOne.position.set(AX, 2.35, -3.4); qs.add(tOne);
const tKeep = tag('この時間が、つづけばいい', { size: 52, w: 720, bg: SONG_GREEN, sx: 2.6 }); tKeep.position.set(AX, 2.35, -3.4); qs.add(tKeep);

// ---------- 3段目. まぶしい日差しの帰り道（x=100）。電柱と、木にとまるセミ。ゆらぐ陽炎。並んで歩くふたり ----------
const BX = 100;
{ const rd = box(30, 0.04, 4, mat('#5a5a5e')); rd.position.set(BX, 0.03, -1.5); qs.add(rd);
  const wl = box(30, 1.2, 0.3, mat('#c8c0b0')); wl.position.set(BX, 0.6, -4.2); qs.add(wl);
  for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 7, 10), mat('#9a9890')); p.position.set(BX - 9 + i * 6, 3.5, -3.6); qs.add(p); const cr = box(1.4, 0.1, 0.1, mat('#6a6860')); cr.position.set(BX - 9 + i * 6, 6.4, -3.6); qs.add(cr); }
  for (let i = 0; i < 3; i++) { const w = box(18, 0.02, 0.02, mat('#2a2a2a')); w.position.set(BX - 4.5 + i * 0.01, 6.5 - i * 0.2, -3.6); qs.add(w); }
  tree(BX - 6, -6, 1.3); tree(BX + 1, -6.4, 1.5); tree(BX + 7, -6, 1.3);
  for (let i = 0; i < 4; i++) { const h = box(3, 2.6, 3, mat(['#e8d8c0', '#d8c8b0', '#c8d0d8', '#e0d0c8'][i])); h.position.set(BX - 9 + i * 6, 1.3, -9); qs.add(h); const rf = box(3.4, 0.3, 3.4, mat('#5a6a7a')); rf.position.set(BX - 9 + i * 6, 2.75, -9); qs.add(rf); } }
const SKY3 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#3a8ae0', '#f8f0d8')); SKY3.position.set(BX, 12, -40); qs.add(SKY3);
const SUN3 = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshBasicMaterial({ color: '#fff8d0', fog: false })); SUN3.position.set(BX + 6, 12, -38); qs.add(SUN3);
const CICADA3 = new THREE.Group(); { const b = box(0.12, 0.26, 0.08, mat('#3a2a1a')); CICADA3.add(b); for (const s of [-1, 1]) { const w = box(0.1, 0.24, 0.01, gl('#d8e8f0', 0.7)); w.position.set(s * 0.07, -0.02, 0.04); w.rotation.z = s * 0.2; CICADA3.add(w); } }
CICADA3.position.set(BX + 1, 1.2, -6.06); qs.add(CICADA3);
const HAZE3 = []; for (let i = 0; i < 5; i++) { const h = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.4), gl('#ffffff', 0.12)); h.rotation.x = -Math.PI / 2; h.position.set(BX - 4 + i * 2.5, 0.1, -1 - (i % 2)); qs.add(h); HAZE3.push(h); }
const me3 = makePerson(ME); me3.position.set(BX, 0.04, -1.2); me3.rotation.y = Math.PI / 2; qs.add(me3);
const you3 = makePerson(YOU); you3.position.set(BX, 0.04, -1.9); you3.rotation.y = Math.PI / 2; qs.add(you3);
const tSun = tag('セミの声と、まぶしい日差し', { size: 50, w: 760, bg: '#14161c', sx: 2.8 }); tSun.position.set(BX, 3.2, -2); qs.add(tSun);
const tPath = tag('いつもの、帰り道', { size: 58, w: 540, bg: SONG_GREEN, sx: 2.1 }); tPath.position.set(BX, 3.2, -2); qs.add(tPath);

// ---------- 4段目. 夕方の土手（x=150）。座って川を見るふたり。主人公の胸から光があふれる ----------
const CX = 150;
{ const gr = box(24, 0.04, 14, mat('#8a9a5a')); gr.position.set(CX, 0.02, -2); qs.add(gr);
  const rv = box(30, 0.06, 5, mat('#e8a868')); rv.position.set(CX, 0.04, -9); qs.add(rv);
  for (let i = 0; i < 4; i++) { const h = box(2.4, 1.8, 2, mat('#4a4060')); h.position.set(CX - 9 + i * 6, 0.9, -14); qs.add(h); } }
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#7a8ac8', '#ffb070')); SKY4.position.set(CX, 10, -40); qs.add(SKY4);
const SUN4 = new THREE.Mesh(new THREE.CircleGeometry(1.8, 32), new THREE.MeshBasicMaterial({ color: '#ffd890', fog: false })); SUN4.position.set(CX, 3.2, -38); qs.add(SUN4);
const me4 = makePerson(ME); me4.position.set(CX - 0.45, 0, -3); me4.rotation.y = Math.PI; qs.add(me4);
const you4 = makePerson(YOU); you4.position.set(CX + 0.45, 0, -3); you4.rotation.y = Math.PI; qs.add(you4);
[me4, you4].forEach(p => { p.userData.legs.forEach(l => l.rotation.x = -1.5); p.position.y = -0.45; });
const GLOW4 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), gl('#ffe8a0', 0.35)); GLOW4.position.set(CX, 1, -3); GLOW4.visible = false; qs.add(GLOW4);
const RAYS4 = []; for (let i = 0; i < 12; i++) { const r = tag('♥', { size: 90, w: 120, h: 120, bg: 'rgba(0,0,0,0)', color: '#ff8aa8', sx: 0.26 }); r.userData.p = [R(), R()]; qs.add(r); RAYS4.push(r); }
const tCare = tag('この人を、大切にしたい', { size: 54, w: 680, bg: '#14161c', sx: 2.5 }); tCare.position.set(CX, 2.2, -3.8); qs.add(tCare);
const tStraight = tag('胸の内が、あふれる', { size: 58, w: 560, bg: SONG_GREEN, sx: 2.1 }); tStraight.position.set(CX, 2.2, -3.8); qs.add(tStraight);

// ---------- 5段目. 記録（x=200）。ジャケットのない無地のディスクと音のバー ----------
const FX = 200;
{ const fl = box(14, 0.04, 12, mat('#2a2e3a')); fl.position.set(FX, 0.02, -1); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#1e222c')); wl.position.set(FX, 4, -5); qs.add(wl); }
const DISC = makeDisc(SONG_GREEN); DISC.position.set(FX, 2.5, -2.4); DISC.scale.setScalar(0.9); qs.add(DISC);
const BARS = makeBars(11, SONG_GREEN); BARS.position.set(FX, 0.3, -2.0); BARS.scale.set(0.8, 0.5, 0.8); qs.add(BARS);
const t2018 = tag('2018年に出た、1曲', { size: 56, w: 620, bg: '#e6b450', color: '#14161c', sx: 2.4 }); t2018.position.set(FX, 4.4, -2.0); qs.add(t2018);
const tPlay = tag('ストリーミング 5億回超え', { size: 54, w: 740, bg: SONG_GREEN, sx: 2.7 }); tPlay.position.set(FX, 4.4, -2.0); qs.add(tPlay);

// ---------- 6段目. オレンジ色の花が一面に咲く花だん（x=250）。花の前に立つ、となりの人 ----------
const NX = 250;
{ const gr = box(20, 0.04, 14, mat('#6a8a3a')); gr.position.set(NX, 0.02, -3); qs.add(gr);
  const bed = box(12, 0.2, 6, mat('#6a4a30')); bed.position.set(NX, 0.1, -5.6); qs.add(bed);
  for (let r = 0; r < 7; r++) for (let i = 0; i < 18; i++) flower(NX - 5.6 + i * 0.66 + (r % 2) * 0.3, -3.0 - r * 0.8, 0.9 + R() * 0.3); }
const SKY6 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#4a9ae8', '#e8f4fa')); SKY6.position.set(NX, 12, -40); qs.add(SKY6);
const you6 = makePerson(YOU); you6.position.set(NX + 0.4, 0, -1.8); qs.add(you6);
const me6 = makePerson(ME); me6.position.set(NX - 0.7, 0, -1.0); me6.rotation.y = 2.4; qs.add(me6);
const tLike = tag('となりの人を、花にたとえた', { size: 52, w: 760, bg: '#14161c', sx: 2.7 }); tLike.position.set(NX, 3.0, -2.6); qs.add(tLike);
const tKana = tag('タイトルは、カタカナ7文字', { size: 52, w: 760, bg: SONG_GREEN, sx: 2.7 }); tKana.position.set(NX, 3.0, -2.6); qs.add(tKana);

// ---------- shots ----------
const ALL = [tLove, tSmile, tOne, tKeep, tSun, tPath, tCare, tStraight, t2018, tPlay, tLike, tKana, Q1];
function base() { GLOW4.visible = false; S.reset(); ALL.forEach(x => x.visible = false); HEART1.forEach(h => h.visible = false); RAYS4.forEach(h => h.visible = false); }

function shotWalk(t, quiz = 0) { // 1段目 0〜9：暑い日の午後、恋人と並んで帰る。ふいに、その笑顔に見とれてしまった（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 1.35;
  const z = quiz ? -2.6 : -2 - t * 0.12;
  [me1, you1].forEach((p, i) => { p.position.z = z; poseWalk(p, t * 4.2 + i * 0.3, quiz ? 0 : 0.8); });
  const glance = quiz ? 1 : ease(clamp((t - 4.6) / 0.6));
  me1.userData.head.rotation.y = 0.7 * glance; you1.userData.head.rotation.y = -0.4 * ease(clamp((t - 5.4) / 0.6)) * (quiz ? 0 : 1);
  if (!quiz && t > 5.6) HEART1.forEach((h, i) => { const q = h.userData.p; const k = clamp((t - 5.6 - q[0] * 0.8) / 2.2); h.visible = k > 0 && k < 1; h.position.set(-0.4 + (q[1] - 0.5) * 0.8, 2.1 + k * 1.0, z + 0.1); });
  Q1.position.set(1.05, 1.75, z - 0.2); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  if (!quiz) { tLove.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tLove.visible = false; tSmile.userData.pop((t - 5.5) / 0.35); }
  tLove.position.z = tSmile.position.z = z - 0.6; tLove.position.y = tSmile.position.y = 2.55;
  const u = ease(t / 9);
  look(lerp(0.3, 0.1, u), lerp(1.8, 1.7, u), z + lerp(4.2, 3.4, u), 0, 1.5, z, 62);
  return qs;
}
function shotBench(t) { // 2段目 9〜17：主人公は、恋をしているひとり。この時間が、ずっとつづけばいいと思っている
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.3;
  [me2, you2].forEach(p => { p.userData.legs.forEach(l => l.rotation.x = -1.5); p.position.y = 0.06 - 0.3; });
  me2.userData.head.rotation.y = 0.35 + Math.sin(t * 0.8) * 0.05; you2.userData.head.rotation.y = -0.2 + Math.sin(t * 0.7) * 0.15;
  me2.userData.arms[1].rotation.x = -0.4; you2.userData.arms[0].rotation.x = -0.4;
  SPARK2.forEach((s, i) => { const q = s.userData.p; s.position.set(AX + (q[0] - 0.5) * 5, 0.6 + ((q[1] + t * 0.08) % 1) * 3.0, -3 + (q[2] - 0.5) * 2); });
  tOne.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tOne.visible = false; tKeep.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.4, 0.1, u), lerp(1.5, 1.6, u), lerp(1.6, 0.8, u), AX, 1.2, -3.2, 62);
  return qs;
}
function shotPath(t) { // 3段目 17〜25：セミの声と、まぶしい日差し。並んで歩く、いつもの帰り道
  base(); S.aim(BX, -2); lift(0); S.hemi.intensity = 1.45;
  const x = BX - 2 + t * 0.6; [me3, you3].forEach((p, i) => { p.position.x = x - i * 0.1; poseWalk(p, t * 4 + i, 0.8); p.position.y += 0.04; });
  CICADA3.rotation.z = Math.sin(t * 40) * 0.03;
  HAZE3.forEach((h, i) => { h.position.y = 0.1 + Math.sin(t * 3 + i) * 0.05; h.material.opacity = 0.08 + Math.sin(t * 2 + i) * 0.04; });
  tSun.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSun.visible = false; tPath.userData.pop((t - 4.3) / 0.35);
  tSun.position.x = tPath.position.x = x;
  const u = ease(t / 8);
  look(x + lerp(1.6, 1.2, u), lerp(1.5, 1.6, u), lerp(2.4, 1.8, u), x, 1.8, -2.2, 64);
  return qs;
}
function shotBank(t) { // 4段目 25〜33：この人を、何があっても大切にしたい。まっすぐな気持ちが、あふれてくる
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 1.0; S.darken(0.15, '#6a3a2a');
  me4.userData.head.rotation.y = -0.5; you4.userData.head.rotation.y = t > 3 ? 0.3 : 0;
  const g = ease(clamp((t - 3.8) / 1.2)); GLOW4.visible = g > 0; GLOW4.position.set(CX - 0.45, 1.0, -2.85); GLOW4.scale.setScalar(0.5 + g * 0.8 + Math.sin(t * 4) * 0.05);
  RAYS4.forEach((h, i) => { const q = h.userData.p; const k = ((t - 4.0) * 0.4 + q[0]) % 1; h.visible = g > 0.2; h.position.set(CX - 0.45 + (q[1] - 0.5) * 2.4 * k, 1.1 + k * 2.2, -2.7); });
  tCare.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCare.visible = false; tStraight.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(0.6, 0.2, u), lerp(1.5, 1.6, u), lerp(1.2, 0.6, u), CX, 1.0, -3.6, 62);
  return qs;
}
function shotFacts(t) { // 5段目 33〜42：2018年に出た、シンガーソングライターの1曲。ストリーミングは、5億回をこえた
  base(); S.aim(FX, -2); lift(0); S.hemi.intensity = 0.7;
  DISC.rotation.z = t * 1.4; BARS.userData.update(t);
  t2018.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2018.visible = false; tPlay.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(FX, lerp(2.6, 2.7, u), lerp(4.0, 3.4, u), FX, 2.6, -2.2, 62);
  return qs;
}
function shotFlowers(t) { // 6段目 42〜49（決め手）：となりの人を、オレンジ色の花にたとえた。タイトルは、その花の名前。カタカナ7文字
  base(); S.aim(NX, -3); lift(0); S.hemi.intensity = 1.35;
  you6.userData.head.rotation.y = -0.5; you6.userData.arms[0].rotation.x = -0.4 + Math.sin(t * 2) * 0.1;
  me6.userData.head.rotation.x = -0.05;
  if (t < 3.6) tLike.userData.pop((t - 0.3) / 0.35); else tKana.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(NX + lerp(-0.4, 0.2, u), lerp(1.8, 1.9, u), lerp(2.6, 1.8, u), NX, 1.2, -3.2, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この曲、わかった？（並木道に戻る）
  shotWalk(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotWalk(t, 0) },
  { a: 9, b: 17, f: shotBench },
  { a: 17, b: 25, f: shotPath },
  { a: 25, b: 33, f: shotBank },
  { a: 33, b: 42, f: shotFacts },
  { a: 42, b: 49, f: shotFlowers },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '暑い日の午後、<br>恋人と並んで帰る。'],
  [5.6, 9.0, 'ふいに、その笑顔に<br>見とれてしまった。'],
  [9.2, 13.2, '主人公は、恋をしている<br>ひとり。'],
  [13.2, 17.0, 'この時間が、ずっと<br>つづけばいいと思っている。'],
  [17.2, 21.0, 'セミの声と、<br>まぶしい日差し。'],
  [21.0, 25.0, '肩を並べる、<br>いつもの帰り道。'],
  [25.2, 29.0, 'この人を、何があっても<br>大切にしたい。'],
  [29.0, 33.0, 'まっすぐな胸の内が、<br>あふれてくる。'],
  [33.2, 37.4, '2018年に出た、<br>シンガーソングライターの1曲。'],
  [37.4, 41.8, 'ストリーミングは、<br>5億回をこえた。'],
  [42.2, 45.4, 'となりの人を、<br>オレンジ色の花にたとえた。'],
  [45.4, 49.0, 'タイトルは、その花。<br>カタカナ7文字。'],
  [49.2, 52.0, 'この曲、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、あいみょんの、<br>マリーゴールド。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q120', v2: true, answer: 'マリーゴールド', kind: '曲',
    title: 'この曲のタイトルは？',
    titleHtml: 'この曲の<br>タイトルは？',
    mood: 'hopeful', seed: 12010,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'bubble'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.0, 'bubble'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '暑い日': 'あついひ', '午後': 'ごご', '歩く': 'あるく', '大好きな': 'だいすきな', '人': 'ひと', '笑顔': 'えがお', '見とれて': 'みとれて', '主人公': 'しゅじんこう', '恋': 'こい', '時間': 'じかん', '思って': 'おもって', '声': 'こえ', '日差し': 'ひざし', '並んで': 'ならんで', '帰り道': 'かえりみち', '帰る': 'かえる', '恋人': 'こいびと', '胸の内': 'むねのうち', '肩': 'かた', '並べる': 'ならべる', '何があっても': 'なにがあっても', '大切': 'たいせつ', '気持ち': 'きもち', '2018年': 'にせんじゅうはちねん', '出た': 'でた', '1曲': 'いっきょく', '5億回': 'ごおくかい', 'オレンジ色': 'オレンジいろ', '花': 'はな', '名前': 'なまえ', 'カタカナ7文字': 'カタカナななもじ', '曲': 'きょく', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この曲のタイトル、わかる？\n暑い日の午後、恋人と並んで帰る。ふいに、その笑顔に見とれてしまった。\n\n曲が描いている物語を、オリジナルの文で作り直したクイズ。答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', '曲当てクイズ', '名曲', '邦楽', '恋愛ソング'],
  },
});
applyQuizCards({ answer: 'マリーゴールド', info: 'あいみょん｜2018年', answerSize: 120, kind: '曲' });
