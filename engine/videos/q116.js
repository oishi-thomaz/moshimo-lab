import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards, makeDisc, makeBars, SONG_GREEN } from './quiz-kit.js';

// タイトル当てクイズ #116 ドライフラワー（曲・優里・2020年）。曲の回（docs/QUIZ.md の 曲のクイズ）
// 確かめた事実（2026/11/20）：
//   ・優里の配信シングル、配信開始 2020年10月25日。初のオリジナル曲 かくれんぼ の「彼女」のその後を女性目線で描いたアフターストーリー
//     （ソニーミュージック公式プロフィール sonymusic.co.jp/artist/yuri/profile/、Billboard JAPAN billboard-japan.com/d_news/detail/107040/2）
//   ・日本レコード協会のストリーミング認定 ダブル・ダイヤモンド（10億回以上。2026年2月度。riaj.or.jp/data/st/search/ で「ドライフラワー」）
//   ・2021年の Billboard JAPAN 年間でストリーミング・ソング・チャート1位（Billboard JAPAN・ソニーミュージック公式）
// 物語：曲が描く状況（長くつきあった人と別れる → ひとりの部屋に戻った女の人 → ふたりで歩いた道をひとりで帰る
//   → 平気なつもりでも、ふとしたときに思い出す・思い出は少しずつ色をなくす）を自分の言葉で作り直したもの。
//   歌詞の言葉・言い回しは使わない（tools/lyric-check.py で歌詞と見比べて、重なる言葉が曲名と文法の切れ端だけなのを確かめた）。
//   音源・ジャケット・MV・THE FIRST TAKE の映像や設定・歌手の見た目は使わない。人は汎用の3D
// 構成（ヒント6段）：1 長く一緒にいた人と別れた・出ていく朝にドアの前で手をふる → 2 ひとり暮らしに戻った女の人・ふたりで選んだ物が残る部屋
//   → 3 夕方の帰り道・前はふたりで歩いた道 → 4 もう平気のはずが、ふとしたときに思い出す・思い出は少しずつ色をなくす
//   → 5 2020年の配信シングル・ある曲のその後の物語・ストリーミング10億回 → 6 決め手：花を逆さにつるして乾かす・タイトルはカタカナ7文字
const S = quizStage({ bg: '#2a2a3a', floor: '#3a3440', fogNear: 30, fogFar: 100 });
const qs = S.scene;
const R = rng(11610);

const HER = { skin: '#f4d3b5', hair: '#3a2a20', shirt: '#e8d8c8', pants: '#6a7a9a', long: true, skirt: true };
const HIM = { skin: '#f1c9a5', hair: '#2a2420', shirt: '#4a5a6a', pants: '#2b3346' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function room(x, wall = '#e8dcc8', floor = '#b89a78') {
  const fl = box(10, 0.04, 9, mat(floor)); fl.position.set(x, 0.02, -2); qs.add(fl);
  const wl = box(10, 4.2, 0.2, mat(wall)); wl.position.set(x, 2.1, -5.5); qs.add(wl);
  const wl2 = box(0.2, 4.2, 9, mat(wall)); wl2.position.set(x - 4, 2.1, -2); qs.add(wl2);
}
function mug(col) { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 14), mat(col)); g.add(c);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 6, 12), mat(col)); h.position.set(0.1, 0, 0); g.add(h); return g; }
function bouquet(cols, n = 7) { const g = new THREE.Group();
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat(cols[i % cols.length]));
    f.position.set(Math.cos(a) * 0.12, 0.42 + (i % 2) * 0.06, Math.sin(a) * 0.12); g.add(f); }
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.45, 8), mat('#5a7a4a')); st.position.y = 0.2; g.add(st);
  const rb = box(0.12, 0.06, 0.12, mat('#d8c8a8')); rb.position.y = 0.16; g.add(rb); return g; }

// ---------- 1段目. マンションの玄関（x=0）。大きなかばんを持って出ていく男の人と、ドアの前で手をふる女の人 ----------
room(0, '#e0d4c4', '#9a8068');
{ const dr = box(1.1, 2.3, 0.08, mat('#7a6a5a')); dr.position.set(1.4, 1.15, -5.38); qs.add(dr);
  const kn = box(0.08, 0.08, 0.06, mat('#c8b070')); kn.position.set(1.0, 1.1, -5.32); qs.add(kn);
  const sh = box(1.4, 1.0, 0.4, mat('#8a6a4a')); sh.position.set(-2.4, 0.5, -5.1); qs.add(sh);
  const mat1 = box(1.2, 0.02, 0.8, mat('#5a6a7a')); mat1.position.set(1.4, 0.04, -4.6); qs.add(mat1);
  const lamp = box(0.6, 0.06, 0.6, gl('#fff0d0')); lamp.position.set(0.4, 4.1, -3); qs.add(lamp); }
const her1 = makePerson(HER); her1.position.set(-0.6, 0, -3.0); her1.rotation.y = 0.6; qs.add(her1);
const him1 = makePerson(HIM); him1.position.set(1.2, 0, -4.2); him1.rotation.y = Math.PI; qs.add(him1);
const BAG1 = box(0.7, 0.5, 0.3, mat('#3a4a5a')); BAG1.position.set(0.32, 0.6, 0); him1.add(BAG1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: SONG_GREEN, sx: 0.5 }); qs.add(Q1);
const tBye = tag('別れの朝', { size: 64, w: 400, bg: '#14161c', sx: 1.4 }); tBye.position.set(0.4, 2.9, -3.6); qs.add(tBye);
const tWave = tag('ドアの前で、手をふった', { size: 54, w: 680, bg: SONG_GREEN, sx: 2.2 }); tWave.position.set(0.4, 2.9, -3.6); qs.add(tWave);

// ---------- 2段目. ひとりの部屋（x=50）。ソファにすわる女の人。テーブルにはおそろいのマグカップがふたつ ----------
const AX = 50;
room(AX, '#d8dce4', '#a88a6a');
{ const sofa = box(2.4, 0.5, 0.9, mat('#8a9aaa')); sofa.position.set(AX - 0.6, 0.35, -4.2); qs.add(sofa);
  const back = box(2.4, 0.7, 0.25, mat('#7a8a9a')); back.position.set(AX - 0.6, 0.85, -4.6); qs.add(back);
  const tb = box(1.4, 0.4, 0.7, mat('#c8a878')); tb.position.set(AX - 0.4, 0.2, -2.9); qs.add(tb);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), new THREE.MeshBasicMaterial({ map: canvasTex(220, 160, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6a7ab0'); gr.addColorStop(1, '#e8b088'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.fillRect(108, 0, 4, h); g.fillRect(0, 78, w, 4); }) }));
  win.position.set(AX + 1.8, 2.4, -5.38); qs.add(win);
  const sh = box(0.8, 1.6, 0.4, mat('#8a6a4a')); sh.position.set(AX + 3.2, 0.8, -5.1); qs.add(sh);
  const fr = box(0.36, 0.28, 0.04, mat('#ffffff')); fr.position.set(AX + 3.2, 1.75, -5.0); qs.add(fr); }
const her2 = makePerson(HER); her2.position.set(AX - 0.9, 0.2, -4.1); qs.add(her2);
const MUG2 = [mug('#e8a0a8'), mug('#a0b8e8')]; MUG2.forEach((m, i) => { m.position.set(AX - 0.6 + i * 0.4, 0.5, -2.9); qs.add(m); });
const tHome = tag('ひとりに、戻った', { size: 62, w: 540, bg: '#14161c', sx: 2.2 }); tHome.position.set(AX - 0.2, 2.9, -3.6); qs.add(tHome);
const tTwo = tag('ふたりで選んだ物が、残る', { size: 52, w: 720, bg: SONG_GREEN, sx: 2.5 }); tTwo.position.set(AX - 0.4, 2.9, -3.6); qs.add(tTwo);

// ---------- 3段目. 夕方の帰り道（x=100）。並木と街灯。ひとりで歩く女の人。となりに、うすい影だけ ----------
const BX = 100;
{ const gr = box(30, 0.04, 20, mat('#7a7472')); gr.position.set(BX, 0.02, -6); qs.add(gr);
  const wk = box(3, 0.05, 20, mat('#b8a898')); wk.position.set(BX, 0.04, -6); qs.add(wk);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.6, 8), mat('#5a4a3a')); tr.position.set(BX + s * 2.2, 0.8, -2 - i * 3); qs.add(tr);
    const cr = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 10), mat(i % 2 ? '#d88a4a' : '#c8a04a')); cr.position.set(BX + s * 2.2, 2.2, -2 - i * 3); qs.add(cr); }
  for (let i = 0; i < 4; i++) { const p = box(0.08, 3, 0.08, mat('#3a3a40')); p.position.set(BX + 1.7, 1.5, -3.5 - i * 4.5); qs.add(p);
    const lp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), gl('#ffe0a0')); lp.position.set(BX + 1.7, 3.05, -3.5 - i * 4.5); qs.add(lp); }
  for (let i = 0; i < 6; i++) { const b = box(3, 4 + (i % 3) * 2, 3, mat(['#4a4a5a', '#5a5060', '#3a4050'][i % 3])); b.position.set(BX - 9 + i * 3.6, 2 + (i % 3), -20); qs.add(b);
    for (let k = 0; k < 6; k++) { const w = box(0.4, 0.4, 0.05, gl('#ffd890')); w.position.set(b.position.x - 0.8 + (k % 3) * 0.8, 1.4 + Math.floor(k / 3) * 1.4, -18.47); qs.add(w); } } }
const SKY3 = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a4a7a'); gr.addColorStop(0.6, '#c87a8a'); gr.addColorStop(1, '#f0b070'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) }));
SKY3.position.set(BX, 10, -30); qs.add(SKY3);
const her3 = makePerson(HER); her3.position.set(BX - 0.4, 0, -4); qs.add(her3);
const GHOST3 = makePerson(HIM); GHOST3.traverse(o => { if (o.isMesh) { o.material = gl('#c8c8e0', 0.18); } }); GHOST3.position.set(BX + 0.45, 0, -4); qs.add(GHOST3);
const tWalk = tag('夕方の、帰り道', { size: 60, w: 520, bg: '#14161c', sx: 2.2 }); tWalk.position.set(BX, 2.9, -5.4); qs.add(tWalk);
const tOnce = tag('前は、ふたりで歩いた', { size: 56, w: 640, bg: SONG_GREEN, sx: 2.6 }); tOnce.position.set(BX, 2.9, -5.4); qs.add(tOnce);

// ---------- 4段目. 夜の部屋（x=150）。窓ぎわで写真立てを見る女の人。まわりに浮かぶ思い出のカードが、少しずつ色をなくす ----------
const CX = 150;
room(CX, '#4a4a60', '#5a4a44');
{ const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.0), new THREE.MeshBasicMaterial({ map: canvasTex(240, 200, (g, w, h) => { g.fillStyle = '#141a30'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffe8a0'; for (let i = 0; i < 30; i++) g.fillRect((i * 53) % w, 120 + (i * 31) % 80, 5, 5); g.fillStyle = '#f4f0e0'; g.beginPath(); g.arc(180, 50, 18, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(118, 0, 4, h); }) }));
  win.position.set(CX + 0.6, 2.4, -5.38); qs.add(win);
  const sill = box(2.6, 0.1, 0.4, mat('#8a7a6a')); sill.position.set(CX + 0.6, 1.35, -5.2); qs.add(sill);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), gl('#ffd8a0')); lamp.position.set(CX - 2.4, 1.3, -4.6); qs.add(lamp); }
const her4 = makePerson(HER); her4.position.set(CX + 0.1, 0, -3.8); her4.rotation.y = 0.2; qs.add(her4);
const FRAME4 = box(0.3, 0.24, 0.03, mat('#e8e0d0')); FRAME4.position.set(0.12, 0.98, 0.32); FRAME4.rotation.x = -0.4; her4.add(FRAME4);
const MEM4 = []; for (let i = 0; i < 6; i++) { const cols = ['#f0a0a8', '#a0c8f0', '#f0d080', '#a0e0b0', '#d0a0f0', '#f0b890'];
  const c = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.48), new THREE.MeshBasicMaterial({ color: cols[i], transparent: true }));
  c.userData.col = new THREE.Color(cols[i]); c.userData.p = [R(), R(), R()]; qs.add(c); MEM4.push(c); }
const tFine = tag('もう平気、のはずが', { size: 58, w: 600, bg: '#14161c', sx: 2.6 }); tFine.position.set(CX + 0.2, 3.7, -4.2); qs.add(tFine);
const tFade = tag('思い出が、遠くなる', { size: 54, w: 620, bg: SONG_GREEN, sx: 3.2 }); tFade.position.set(CX + 0.2, 3.7, -4.2); qs.add(tFade);

// ---------- 5段目. 記録（x=200）。ジャケットのない無地のディスクと音のバー ----------
const FX = 200;
{ const fl = box(14, 0.04, 10, mat('#1e2028')); fl.position.set(FX, 0.02, -2); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#22262e')); wl.position.set(FX, 4, -5); qs.add(wl); }
const DISC = makeDisc(SONG_GREEN); DISC.position.set(FX, 2.5, -2.4); DISC.scale.setScalar(0.9); qs.add(DISC);
const BARS = makeBars(11, SONG_GREEN); BARS.position.set(FX, 0.3, -2.0); BARS.scale.set(0.8, 0.5, 0.8); qs.add(BARS);
const tYear = tag('2020年の配信シングル', { size: 56, w: 680, bg: '#14161c', sx: 2.5 }); tYear.position.set(FX, 4.4, -2.0); qs.add(tYear);
const tPlay = tag('ストリーミング 10億回超え', { size: 54, w: 740, bg: SONG_GREEN, sx: 2.7 }); tPlay.position.set(FX, 4.4, -2.0); qs.add(tPlay);

// ---------- 6段目. 窓ぎわ（x=250）。花たばを逆さにつるして乾かしている。色はあせても、形は残る ----------
const NX = 250;
room(NX, '#e8e0d4', '#b8a088');
{ const win = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.2), new THREE.MeshBasicMaterial({ map: canvasTex(260, 220, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9ac0e8'); gr.addColorStop(1, '#f0e0c8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.fillRect(128, 0, 4, h); }) }));
  win.position.set(NX, 2.2, -5.38); qs.add(win);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.0, 8), mat('#8a6a4a')); rod.rotation.z = Math.PI / 2; rod.position.set(NX, 3.45, -5.0); qs.add(rod); }
const HANG6 = []; [['#c87a8a', '#d8a070', '#b8a0c0'], ['#a87a7a', '#c8a880', '#9a8a70'], ['#d89a9a', '#e0c090', '#a8b080']].forEach((cs, i) => {
  const b = bouquet(cs, 8); b.rotation.x = Math.PI; b.position.set(NX - 0.8 + i * 0.8, 3.45, -4.95); b.scale.setScalar(1.8); qs.add(b);
  const str = box(0.01, 0.12, 0.01, mat('#4a3a2a')); str.position.set(NX - 0.8 + i * 0.8, 3.38, -4.95); qs.add(str); HANG6.push(b); });
const her6 = makePerson(HER); her6.position.set(NX + 0.95, 0, -3.7); her6.rotation.y = -0.6; qs.add(her6);
const tHang = tag('逆さにつるして、乾かす', { size: 54, w: 700, bg: '#14161c', sx: 2.6 }); tHang.position.set(NX, 4.35, -4.6); qs.add(tHang);
const tKana = tag('タイトルは、カタカナ7文字', { size: 52, w: 760, bg: SONG_GREEN, sx: 2.8 }); tKana.position.set(NX, 4.35, -4.6); qs.add(tKana);

// ---------- shots ----------
const ALL = [tBye, tWave, tHome, tTwo, tWalk, tOnce, tFine, tFade, tYear, tPlay, tHang, tKana, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotDoor(t, quiz = 0) { // 1段目 0〜9：長く一緒にいた人と別れた。最後の日、ドアの前で手をふった（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.0;
  const w = quiz ? 0.3 : ease(clamp((t - 1.0) / 5.5));
  him1.position.z = -4.2 - w * 0.9; him1.visible = w < 0.98; poseWalk(him1, t * 5, w > 0 && w < 1 ? 0.5 : 0);
  her1.userData.arms[1].rotation.x = quiz ? -0.3 : (t > 4.4 ? -2.6 : -0.3); her1.userData.arms[1].rotation.z = t > 4.4 && !quiz ? -0.3 + Math.sin(t * 6) * 0.25 : 0;
  her1.userData.head.rotation.x = t > 6.6 && !quiz ? 0.25 : 0;
  Q1.position.set(-1.05, 2.3, -2.9); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  if (!quiz) { tBye.userData.pop((t - 1.6) / 0.35); if (t > 4.2) tBye.visible = false; tWave.userData.pop((t - 4.4) / 0.35); }
  const u = ease(t / 9);
  look(lerp(-1.6, -1.4, u), lerp(2.0, 2.1, u), lerp(1.6, 1.0, u), 0.4, 1.3, -4.2, 60);
  return qs;
}
function shotRoom(t) { // 2段目 9〜17：主人公は、ひとり暮らしに戻った女の人。部屋には、ふたりで選んだ物が残っている
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 0.95; S.darken(0.1, '#e8b088');
  her2.userData.legs.forEach(l => l.rotation.x = -1.5); her2.position.y = -0.05; her2.userData.head.rotation.x = 0.3 + Math.sin(t * 0.6) * 0.05;
  her2.userData.arms.forEach(a => a.rotation.x = -0.8);
  tHome.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tHome.visible = false; tTwo.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.6, 0.2, u), lerp(1.9, 1.8, u), lerp(1.8, 1.0, u), AX - 0.4, 1.1, -3.6, 62);
  return qs;
}
function shotWalk(t) { // 3段目 17〜25：夕方の帰り道、街の明かりがにじむ。前は、ふたりで歩いた道
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 0.8; S.darken(0.3, '#c87a8a');
  her3.position.z = -4 - t * 0.35; her3.rotation.y = Math.PI; poseWalk(her3, t * 5, 0.5);
  GHOST3.visible = t > 4.3; GHOST3.position.z = her3.position.z; GHOST3.rotation.y = Math.PI; poseWalk(GHOST3, t * 5 + 0.3, 0.5);
  GHOST3.traverse(o => { if (o.isMesh) o.material.opacity = 0.22 * clamp((t - 4.3) / 1.0) * (0.8 + Math.sin(t * 3) * 0.2); });
  tWalk.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tWalk.visible = false; tOnce.userData.pop((t - 4.3) / 0.35);
  tWalk.position.z = tOnce.position.z = her3.position.z - 1.4;
  const u = ease(t / 8);
  look(BX + lerp(0.3, 0.1, u), lerp(2.7, 2.8, u), her3.position.z + lerp(4.4, 4.0, u), BX, 0.9, her3.position.z - 4, 62);
  return qs;
}
function shotFade(t) { // 4段目 25〜33：もう平気、と思ったのに、ふとしたときに思い出す。思い出は、少しずつ色をなくしていく
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 0.55; S.darken(0.5, '#0a0c18');
  her4.userData.arms.forEach(a => a.rotation.x = -0.9); her4.userData.head.rotation.x = 0.35;
  const fade = clamp((t - 4.3) / 3.2);
  MEM4.forEach((c, i) => { const q = c.userData.p; const a = i / MEM4.length * Math.PI * 2 + t * 0.2;
    c.position.set(CX + 0.1 + Math.cos(a) * 1.5, 1.9 + Math.sin(a * 1.3 + q[0]) * 0.5 + q[1] * 0.4, -3.6 + Math.sin(a) * 0.6); c.lookAt(CX + 0.1, 2.0, 3);
    c.material.color.copy(c.userData.col).lerp(new THREE.Color('#9a9a9a'), fade * (0.6 + q[2] * 0.4)); c.material.opacity = 0.95 - fade * 0.35; });
  tFine.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tFine.visible = false; tFade.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(-0.6, -0.2, u), lerp(2.0, 2.1, u), lerp(1.8, 1.0, u), CX + 0.1, 1.9, -4.2, 62);
  return qs;
}
function shotFacts(t) { // 5段目 33〜42：2020年に配信された、ある曲の、その後の物語。ストリーミングは10億回をこえた
  base(); S.aim(FX, -2); lift(0); S.hemi.intensity = 0.7; S.darken(0.5, '#06070a');
  DISC.rotation.z = t * 1.4; BARS.userData.update(t);
  tYear.userData.pop((t - 0.4) / 0.35); if (t > 4.1) tYear.visible = false; tPlay.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(FX + lerp(0.4, 0.1, u), lerp(2.6, 2.7, u), lerp(4.4, 3.8, u), FX, 2.6, -2.2, 62);
  return qs;
}
function shotFlower(t) { // 6段目 42〜49（決め手）：花を逆さにつるして乾かすと、色はあせても形は残る。タイトルは、カタカナ7文字
  base(); S.aim(NX, -3); lift(0); S.hemi.intensity = 1.05;
  HANG6.forEach((b, i) => { b.rotation.z = Math.sin(t * 1.2 + i) * 0.04; });
  her6.userData.head.rotation.x = -0.35; her6.userData.arms[0].rotation.x = t > 1.2 ? -1.0 : 0;
  if (t < 3.6) tHang.userData.pop((t - 0.3) / 0.35); else tKana.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(NX + lerp(0.6, 0.4, u), lerp(1.7, 1.8, u), lerp(1.8, 1.0, u), NX, 3.0, -5.0, 60);
  return qs;
}
function shotQuiz(t) { // 49〜56：この曲、わかった？（玄関に戻る）
  shotDoor(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotDoor(t, 0) },
  { a: 9, b: 17, f: shotRoom },
  { a: 17, b: 25, f: shotWalk },
  { a: 25, b: 33, f: shotFade },
  { a: 33, b: 42, f: shotFacts },
  { a: 42, b: 49, f: shotFlower },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '長く一緒にいた人と、<br>別れることになった。'],
  [5.6, 9.0, '出ていく朝、ドアの前で<br>手をふった。'],
  [9.2, 13.2, '主人公は、ひとり暮らしに<br>戻った女の人。'],
  [13.2, 17.0, '家には、ふたりで<br>選んだ物が残っている。'],
  [17.2, 21.0, '夕方の帰り道、<br>街の明かりがにじむ。'],
  [21.0, 25.0, '前は、ふたりで<br>歩いた道。'],
  [25.2, 29.0, 'もう平気、のはずなのに、<br>ふとしたときに浮かぶ。'],
  [29.0, 33.0, 'ふたりの記憶は、少しずつ<br>遠くなっていく。'],
  [33.2, 37.4, '2020年に配信された、<br>ある曲の、その後の物語。'],
  [37.4, 41.8, 'ストリーミングは、<br>10億回をこえた。'],
  [42.2, 45.4, '花を逆さにつるして<br>乾かすと、形は残る。'],
  [45.4, 49.0, 'タイトルは、乾かした花。<br>カタカナ7文字。'],
  [49.2, 52.0, 'この曲、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、優里の、<br>ドライフラワー。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q116', v2: true, answer: 'ドライフラワー', kind: '曲',
    title: 'この曲のタイトルは？',
    titleHtml: 'この曲の<br>タイトルは？',
    mood: 'hopeful', seed: 11610,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 4.6, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '優里': 'ゆうり', '長く': 'ながく', '一緒': 'いっしょ', '人': 'ひと', '別れる': 'わかれる', '出ていく': 'でていく', '朝': 'あさ', '別れ': 'わかれ', '前': 'まえ', '手': 'て', '主人公': 'しゅじんこう', 'ひとり暮らし': 'ひとりぐらし', '戻った': 'もどった', '女の人': 'おんなのひと', '選んだ': 'えらんだ', '物': 'もの', '残って': 'のこって', '夕方': 'ゆうがた', '帰り道': 'かえりみち', '街': 'まち', '明かり': 'あかり', '歩いた': 'あるいた', '道': 'みち', '平気': 'へいき', '浮かぶ': 'うかぶ', '記憶': 'きおく', '家': 'いえ', '少しずつ': 'すこしずつ', '遠く': 'とおく', '2020年': 'にせんにじゅうねん', '配信': 'はいしん', '曲': 'きょく', '物語': 'ものがたり', '10億回': 'じゅうおくかい', '花': 'はな', '逆さ': 'さかさ', '乾かす': 'かわかす', '乾かした': 'かわかした', '形': 'かたち', '残る': 'のこる', 'カタカナ7文字': 'カタカナななもじ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この曲のタイトル、わかる？\n長く一緒にいた人と、別れることになった。出ていく朝、ドアの前で手をふった。\n\n曲が描いている物語を、オリジナルの文で作り直したクイズ。答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', '曲当てクイズ', '名曲', '邦楽', '失恋ソング'],
  },
});
applyQuizCards({ answer: 'ドライフラワー', info: '優里｜2020年', answerSize: 120, kind: '曲' });
