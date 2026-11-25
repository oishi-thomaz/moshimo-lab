import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #143 ライフ・イズ・ビューティフル（映画・イタリア・1997年製作・117分。U-NEXT で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/raihuizubiyuteihuru（見放題：U-NEXT）と
//   Filmarks の動画配信欄（U-NEXT 見放題。Prime Video はレンタル）で2026/11/25確認。
//   Filmarks 4.2・レビュー136,402件 filmarks.com/movies/21258）
// 確かめた事実（2026/11/25）：
//   ・映画.com eiga.com/movie/50458 ：1997年製作／117分／イタリア。ロベルト・ベニーニが監督・脚本・主演。1939年、トスカーナ地方の小さな町へ
//     やって来たユダヤ系イタリア人の陽気な男性は、美しい小学校教師と運命的な出会いを果たす。いつも陽気で機転のきく彼に彼女も心を奪われ、2人は結婚。
//     息子も生まれ幸せな日々を送るが、町にもユダヤ人迫害の魔の手が迫り、3人は強制収容所に連行されてしまう。
//     彼は幼い息子に悲惨な現実を悟られないよう、ひたすら陽気に振る舞いながら嘘をつき続ける。
//     第71回アカデミー賞で主演男優賞、外国語映画賞、作曲賞
//   ・JustWatch 日本版の紹介文：1997年のイタリア映画。第二次世界大戦下のユダヤ人迫害を、ユダヤ系イタリア人の親子の視点から描いた作品。
//     カンヌ国際映画祭で審査員グランプリ
// 構成（ヒント6段）：1 小さな町にやってきた陽気な男・ひと目で恋に落ちる → 2 主人公はいつも明るく機転がきく男・相手は小学校の先生
//   → 3 ふたりは結婚し息子が生まれる・でも戦争の影がしのびよる → 4 家族は収容所へ送られる・父は幼い息子を守ると決める
//   → 5 1997年のイタリア映画・アカデミー賞で主演男優賞など3部門 → 6 決め手：つらい現実を息子にさとられないよう・ひたすら陽気にうそをつき続ける
// 結末は言わない。暴力・収容所の苦しみの場面は見せない（遠くの柵と貨車だけ）。登場人物の名前・町の名前は出さない。
// 俳優の顔・ポスター・ロゴは使わない。有名な場面の構図（自転車の出会い・戦車など）はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#c8d8e8', floor: '#b8a888', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(14310);

const DAD = { skin: '#f0c49c', hair: '#2a2018', shirt: '#e8e0d0', pants: '#5a4a3a' };
const MOM = { skin: '#f4d3b5', hair: '#6a3a1a', shirt: '#d87a6a', pants: '#e8dcc8', long: true, skirt: true };
const BOY = { skin: '#f4d3b5', hair: '#3a2418', shirt: '#4a7aaa', pants: '#3a3a44', scale: 0.62 };
const KIDS = [{ skin: '#f4d3b5', hair: '#3a2418', shirt: '#e8c040', pants: '#3a3a44', scale: 0.6 }, { skin: '#f1c9a5', hair: '#5a3a1a', shirt: '#6ab07a', pants: '#3a3a44', long: true, skirt: true, scale: 0.58 }, { skin: '#f4d3b5', hair: '#1a1410', shirt: '#d86a8a', pants: '#3a3a44', long: true, skirt: true, scale: 0.6 }];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
const skyTex = (a, b) => new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
function house(x, z, w, h, c, roof = '#b8603a') { const b = box(w, h, 4, mat(c)); b.position.set(x, h / 2, z); qs.add(b); const r = box(w + 0.4, 0.3, 4.4, mat(roof)); r.position.set(x, h + 0.15, z); qs.add(r);
  for (let i = 0; i < Math.floor(w / 1.4); i++) for (let k = 0; k < Math.floor(h / 2); k++) { const wn = box(0.5, 0.8, 0.05, mat('#4a3a2a')); wn.position.set(x - w / 2 + 0.8 + i * 1.4, 1.4 + k * 1.8, z + 2.02); qs.add(wn); const sh = box(0.2, 0.8, 0.04, mat('#5a8a5a')); sh.position.set(x - w / 2 + 0.45 + i * 1.4, 1.4 + k * 1.8, z + 2.03); qs.add(sh); } }

// ---------- 1段目. 晴れた日の小さな町の広場（x=0）。石だたみ、オレンジ屋根の家、噴水。やってきた陽気な男と、すれちがう女性 ----------
const SKY1 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#8ab8e8', '#e8f0f4')); SKY1.position.set(0, 12, -40); qs.add(SKY1);
{ const pv = box(30, 0.04, 16, mat('#c8b898')); pv.position.set(0, 0.03, -4); qs.add(pv);
  for (let i = 0; i < 5; i++) house(-10 + i * 5, -13, 4.4, 4 + R() * 3, ['#e8c898', '#e8b080', '#f0d8b0', '#d8a878'][i % 4]);
  const ft = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.5, 20), mat('#d8d0c0')); ft.position.set(-2.6, 0.25, -6.5); qs.add(ft);
  const wa = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.05, 20), mat('#7ab0d8')); wa.position.set(-2.6, 0.48, -6.5); qs.add(wa);
  const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.2, 10), mat('#d8d0c0')); pl.position.set(-2.6, 1.0, -6.5); qs.add(pl);
  for (let i = 0; i < 3; i++) { const tr = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 8), mat('#6a9a4a')); tr.position.set(3 + i * 2.4, 2.6, -8); qs.add(tr); const tk = box(0.2, 2, 0.2, mat('#6a4a3a')); tk.position.set(3 + i * 2.4, 1, -8); qs.add(tk); } }
const DAD1 = person(DAD, -1.6, -2.4, 0.9);
const MOM1 = person(MOM, 1.1, -3.6, -1.2);
const HEARTS1 = []; for (let i = 0; i < 6; i++) { const h = tag('♥', { size: 90, w: 120, h: 120, bg: 'rgba(0,0,0,0)', color: '#e84a6a', sx: 0.32 }); qs.add(h); HEARTS1.push(h); }
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tArrive = tag('小さな町にやってきた、陽気な男', { size: 46, w: 860, bg: '#14161c', sx: 1.95 }); qs.add(tArrive);
const tLove = tag('ひと目で、恋に落ちる', { size: 56, w: 620, bg: '#e24050', sx: 1.55 }); qs.add(tLove);

// ---------- 2段目. 町の小学校の前（x=50）。白い校舎と黒板の見える窓。子どもたちと女の先生、道化のようにおどけてみせる男 ----------
const AX = 50;
const SKY2 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#9ac0e8', '#eef2f4')); SKY2.position.set(AX, 12, -40); qs.add(SKY2);
{ const pv = box(30, 0.04, 16, mat('#c8b898')); pv.position.set(AX, 0.03, -4); qs.add(pv);
  const sc = box(12, 5, 4, mat('#f0ece0')); sc.position.set(AX, 2.5, -9); qs.add(sc); const rf = box(12.4, 0.4, 4.4, mat('#b8603a')); rf.position.set(AX, 5.2, -9); qs.add(rf);
  for (let i = 0; i < 4; i++) { const wn = box(1.4, 1.2, 0.05, mat('#2a3a2a')); wn.position.set(AX - 4.2 + i * 2.8, 3.2, -6.97); qs.add(wn); }
  const dr = box(1.6, 2.4, 0.06, mat('#7a5a3a')); dr.position.set(AX, 1.2, -6.97); qs.add(dr);
  const bl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), mat('#c8a040')); bl.position.set(AX + 1.2, 2.6, -6.8); qs.add(bl); }
const MOM2 = person(MOM, AX - 0.9, -4.6, 0.3);
const KIDS2 = KIDS.map((o, i) => person(o, AX - 2.4 + i * 0.6, -3.8 + (i % 2) * 0.3, 0.4));
const DAD2 = person(DAD, AX + 1.2, -3.4, -0.7);
const tBright = tag('主人公は、いつも明るい男', { size: 52, w: 720, bg: '#14161c', sx: 1.75 }); qs.add(tBright);
const tTeacher = tag('恋した相手は、小学校の先生', { size: 50, w: 760, bg: '#e24050', sx: 1.8 }); qs.add(tTeacher);

// ---------- 3段目. 家の前（x=100）。3人家族。空に広がる灰色の雲 ----------
const BX = 100;
const SKY3 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#7a8494', '#c8c4bc')); SKY3.position.set(BX, 12, -40); qs.add(SKY3);
{ const pv = box(30, 0.04, 16, mat('#b8a888')); pv.position.set(BX, 0.03, -4); qs.add(pv); house(BX + 0.6, -9, 6, 4.4, '#e8c898'); }
const CLOUDS3 = []; for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(2 + R() * 2, 10, 8), gl('#5a5e66', 0.85)); c.userData.x = BX - 24 + i * 6; c.position.set(c.userData.x, 14 + R() * 3, -32); c.scale.y = 0.5; qs.add(c); CLOUDS3.push(c); }
const DAD3 = person(DAD, BX - 0.7, -4.2, 0.2); const MOM3 = person(MOM, BX + 0.7, -4.3, -0.2); const BOY3 = person(BOY, BX, -3.8, 0);
const tFamily = tag('ふたりは結婚し、息子が生まれる', { size: 48, w: 820, bg: '#14161c', sx: 1.85 }); qs.add(tFamily);
const tShadow = tag('でも、戦争の影がしのびよる', { size: 50, w: 760, bg: '#e24050', sx: 1.8 }); qs.add(tShadow);

// ---------- 4段目. 夕暮れの線路（x=150）。遠くに止まる木の貨車と高い柵。息子の手をにぎる父 ----------
const CX = 150;
const SKY4 = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyTex('#5a5e70', '#c8a888')); SKY4.position.set(CX, 12, -40); qs.add(SKY4);
{ const gr = box(40, 0.04, 20, mat('#7a7068')); gr.position.set(CX, 0.03, -4); qs.add(gr);
  for (const dz of [-0.7, 0.7]) { const rl = box(40, 0.08, 0.08, mat('#5a5a5a')); rl.position.set(CX, 0.1, -9 + dz); qs.add(rl); }
  for (let i = 0; i < 3; i++) { const wc = box(6, 2.6, 2.6, mat('#6a4a34')); wc.position.set(CX - 7 + i * 6.6, 1.7, -9); qs.add(wc); for (let k = 0; k < 4; k++) { const pl = box(0.06, 2.6, 0.04, mat('#4a3424')); pl.position.set(CX - 9.4 + i * 6.6 + k * 1.6, 1.7, -7.68); qs.add(pl); } }
  for (let i = 0; i < 14; i++) { const fp = box(0.12, 3.2, 0.12, mat('#4a4a4a')); fp.position.set(CX - 13 + i * 2, 1.6, -15); qs.add(fp); }
  for (let k = 0; k < 4; k++) { const wr = box(28, 0.03, 0.03, mat('#5a5a5a')); wr.position.set(CX, 0.8 + k * 0.7, -15); qs.add(wr); } }
const DAD4 = person(DAD, CX - 0.35, -3.6, Math.PI); const BOY4 = person(BOY, CX + 0.35, -3.6, Math.PI);
const tCamp = tag('家族は、収容所へ送られてしまう', { size: 48, w: 840, bg: '#14161c', sx: 1.9 }); qs.add(tCamp);
const tProtect = tag('父は、幼い息子を守ると決める', { size: 48, w: 820, bg: '#e24050', sx: 1.85 }); qs.add(tProtect);

// ---------- 5段目. 夜の映画館（x=200）。光るスクリーンと、ならんだ赤い座席 ----------
const DX = 200;
{ const fl = box(14, 0.04, 14, mat('#1a1416')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const st = box(0.55, 0.5, 0.5, mat('#8a1a24')); st.position.set(DX - 2.4 + i * 0.6, 0.35 + r * 0.25, -1 + r * 1.0); qs.add(st); const bk = box(0.55, 0.6, 0.12, mat('#7a1620')); bk.position.set(DX - 2.4 + i * 0.6, 0.85 + r * 0.25, -0.76 + r * 1.0); qs.add(bk); } }
const SCREEN5 = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.2), new THREE.MeshBasicMaterial({ color: '#6a7a9a' })); SCREEN5.position.set(DX, 3.0, -7); qs.add(SCREEN5);
const SL5 = new THREE.PointLight('#c8d8ff', 3, 14); SL5.position.set(DX, 3, -5); qs.add(SL5);
const TROPHY5 = []; for (let i = 0; i < 3; i++) { const g = new THREE.Group(); const gm = new THREE.MeshStandardMaterial({ color: '#e6b450', metalness: 0.8, roughness: 0.3, emissive: '#4a3a10' });
  const bs = box(0.3, 0.14, 0.3, mat('#2a2a2a')); g.add(bs); const bd = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 10), gm); bd.position.y = 0.37; g.add(bd); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), gm); hd.position.y = 0.74; g.add(hd);
  g.position.set(DX - 0.9 + i * 0.9, 1.6, -3.2); qs.add(g); TROPHY5.push(g); }
const t1997 = tag('1997年の、イタリア映画', { size: 54, w: 680, bg: '#e6b450', color: '#14161c', sx: 1.65 }); qs.add(t1997);
const tOscar = tag('アカデミー賞で、主演男優賞など3部門', { size: 44, w: 920, bg: '#e24050', sx: 2.0 }); qs.add(tOscar);

// ---------- 6段目. 木の小屋の中（x=250）。小さな灯り。ひざをついて、笑っておどけてみせる父と、見上げる息子 ----------
const EX = 250;
{ const fl = box(12, 0.04, 10, mat('#5a4a3a')); fl.position.set(EX, 0.02, -3); qs.add(fl);
  const wl = box(12, 4, 0.3, mat('#6a5040')); wl.position.set(EX, 2, -6.5); qs.add(wl);
  for (let i = 0; i < 12; i++) { const pk = box(0.04, 4, 0.06, mat('#4a3628')); pk.position.set(EX - 5.5 + i, 2, -6.32); qs.add(pk); }
  for (let k = 0; k < 3; k++) { const bk = box(2.6, 0.12, 1.4, mat('#7a5a40')); bk.position.set(EX - 3.2, 0.6 + k * 1.0, -5.4); qs.add(bk); }
  for (const dx of [-4.4, -2.0]) { const po = box(0.12, 3.2, 0.12, mat('#4a3628')); po.position.set(EX + dx, 1.6, -4.7); qs.add(po); } }
const LAMP6 = new THREE.PointLight('#ffc878', 4, 7); LAMP6.position.set(EX + 0.4, 2.0, -2.6); qs.add(LAMP6);
const LB6 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), gl('#ffd898')); LB6.position.set(EX + 0.4, 2.4, -3.6); qs.add(LB6);
const DAD6 = person(DAD, EX - 0.2, -3.4, 0.5); DAD6.userData.legs[0].rotation.x = -1.4; DAD6.position.y = -0.42;
const BOY6 = person(BOY, EX + 0.7, -3.0, -1.0);
const STARS6 = []; for (let i = 0; i < 8; i++) { const s = tag('★', { size: 80, w: 110, h: 110, bg: 'rgba(0,0,0,0)', color: '#ffd860', sx: 0.26 }); qs.add(s); STARS6.push(s); }
const tHide = tag('つらい現実を、息子にさとられないよう', { size: 44, w: 920, bg: '#14161c', sx: 2.0 }); qs.add(tHide);
const tLie = tag('ひたすら陽気に、うそをつき続ける', { size: 46, w: 860, bg: '#e6b450', color: '#14161c', sx: 1.95 }); qs.add(tLie);

// ---------- shots ----------
const ALL = [tArrive, tLove, tBright, tTeacher, tFamily, tShadow, tCamp, tProtect, t1997, tOscar, tHide, tLie, Q1, ...HEARTS1, ...STARS6];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotSquare(t, quiz = 0) { // 1段目 0〜9：小さな町にやってきた、陽気な男。ある女性に、ひと目で恋に落ちる（0秒目がサムネ）
  base(); S.aim(0, -4); lift(0); S.hemi.intensity = 1.3; S.key.intensity = 1.6;
  const k = clamp(t / 4.5); DAD1.position.x = -1.1 + k * 0.4; poseWalk(DAD1, t * 6, k < 1 ? 0.9 : 0); DAD1.rotation.y = k < 1 ? 1.4 : 0.9;
  if (k >= 1) { DAD1.userData.arms[1].rotation.x = -2.6 + Math.sin(t * 6) * 0.3; DAD1.userData.head.rotation.y = 0.3; }
  MOM1.userData.head.rotation.y = t > 5 ? -0.3 : 0;
  HEARTS1.forEach((h, i) => { const s = (t - 5.6 - i * 0.25); h.position.set(-0.3 + Math.sin(i * 2) * 0.5, 2.0 + clamp(s) * 0.4 + (s > 0 ? (s % 1.5) * 0.3 : 0), -2.6); h.userData.pop(quiz ? 0 : clamp(s / 0.3)); });
  Q1.position.set(0.2, 2.35, -3.4); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tArrive, 1.05); pin(tLove, 1.05);
  if (!quiz) { tArrive.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tArrive.visible = false; tLove.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.4, 0.2, u), lerp(1.9, 1.8, u), lerp(2.8, 2.0, u), 0.0, 1.4, -3.2, 62);
  return qs;
}
function shotSchool(t) { // 2段目 9〜17：主人公は、いつも明るくて機転がきく男。恋した相手は、小学校の先生
  base(); S.aim(AX, -4); lift(0); S.hemi.intensity = 1.3; S.key.intensity = 1.5;
  DAD2.userData.arms[0].rotation.z = 0.6 + Math.sin(t * 5) * 0.3; DAD2.userData.arms[1].rotation.z = -0.6 - Math.sin(t * 5) * 0.3; DAD2.position.y = Math.abs(Math.sin(t * 5)) * 0.12;
  KIDS2.forEach((c, i) => { c.userData.head.rotation.x = -0.2; c.userData.arms[1].rotation.x = t > 4.4 && i !== 1 ? -2.6 : 0; });
  MOM2.userData.head.rotation.y = -0.3;
  const u = ease(t / 8);
  look(AX + lerp(0.6, 0.3, u), lerp(1.8, 1.7, u), lerp(1.6, 0.8, u), AX - 0.3, 1.2, -4.0, 62);
  pin(tBright, 1.05); pin(tTeacher, 1.05);
  tBright.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tBright.visible = false; tTeacher.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotHome(t) { // 3段目 17〜25：ふたりは結婚し、息子が生まれる。でも、戦争の影がしのびよる
  const dark = clamp((t - 4.0) / 2.5);
  base(); S.aim(BX, -4); lift(0); S.hemi.intensity = lerp(1.25, 0.8, dark); S.key.intensity = lerp(1.4, 0.5, dark); S.darken(dark * 0.4, '#3a3e48');
  CLOUDS3.forEach((c, i) => { c.position.x = c.userData.x + t * 1.2; c.position.y = lerp(16, 10, dark) + (i % 3); c.material.opacity = 0.4 + dark * 0.5; });
  BOY3.userData.arms.forEach(a => a.rotation.x = -0.5); DAD3.userData.arms[1].rotation.z = -0.3; MOM3.userData.arms[0].rotation.z = 0.3;
  DAD3.userData.head.rotation.x = t > 4.5 ? -0.3 : 0;
  const u = ease(t / 8);
  look(BX + lerp(0.3, 0.0, u), lerp(1.7, 1.9, u), lerp(1.2, 0.6, u), BX, lerp(1.2, 2.0, u), -4.4, 62);
  pin(tFamily, 1.05); pin(tShadow, 1.05);
  tFamily.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tFamily.visible = false; tShadow.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotRail(t) { // 4段目 25〜33：家族は、収容所へ送られてしまう。父は、幼い息子を守ると決める
  base(); S.aim(CX, -5); lift(0); S.hemi.intensity = 0.75; S.key.intensity = 0.6; S.key.color.set('#e8b898'); S.darken(0.25, '#3a3040');
  DAD4.userData.arms[0].rotation.x = -0.2; BOY4.userData.arms[1].rotation.x = -0.5;
  if (t > 4.4) { DAD4.rotation.y = lerp(Math.PI, Math.PI - 1.2, clamp((t - 4.4) / 0.8)); DAD4.userData.head.rotation.x = 0.4; }
  const u = ease(t / 8);
  look(CX + lerp(2.0, 1.6, u), lerp(1.8, 1.75, u), lerp(0.8, 0.2, u), CX, 1.2, -5.2, 62);
  pin(tCamp, 1.05); pin(tProtect, 1.05);
  tCamp.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCamp.visible = false; tProtect.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTheater(t) { // 5段目 33〜42：1997年の、イタリア映画。アカデミー賞で、主演男優賞など3部門を受賞
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.4; S.key.intensity = 0.2; S.darken(0.8, '#020204');
  SCREEN5.material.color.setHSL(0.6, 0.22, 0.42 + Math.sin(t * 2.3) * 0.06);
  TROPHY5.forEach((g, i) => { g.visible = t > 4.3 + i * 0.25; g.rotation.y = t * 1.2; });
  const u = ease(t / 9);
  look(DX + lerp(-0.4, 0.4, u), lerp(2.4, 2.3, u), lerp(2.4, 1.6, u), DX, 1.8, -4.5, 62);
  pin(t1997, 1.05); pin(tOscar, 1.05);
  t1997.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t1997.visible = false; tOscar.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotHut(t) { // 6段目 42〜49（決め手）：父は、つらい現実を息子にさとられないよう、ひたすら陽気に、うそをつき続ける
  base(); S.aim(EX, -3); lift(0); S.hemi.intensity = 0.5; S.key.intensity = 0.35; S.darken(0.6, '#0a0806');
  LAMP6.intensity = 3.6 + Math.sin(t * 7) * 0.3;
  DAD6.userData.arms[1].rotation.x = -2.4 + Math.sin(t * 4) * 0.4; DAD6.userData.arms[0].rotation.z = 0.5 + Math.sin(t * 4 + 1) * 0.3; DAD6.userData.head.rotation.z = Math.sin(t * 3) * 0.15;
  BOY6.userData.head.rotation.x = -0.25;
  STARS6.forEach((s, i) => { const a = i / STARS6.length * 6.28 + t * 0.8; s.position.set(EX + 0.2 + Math.cos(a) * 0.8, 1.25 + Math.sin(a) * 0.3, -3.2); s.userData.pop(clamp((t - 1 - i * 0.15) / 0.3)); });
  const u = ease(t / 7);
  look(EX + lerp(0.9, 0.6, u), lerp(1.4, 1.4, u), lerp(0.4, -0.2, u), EX + 0.2, 1.1, -3.2, 62);
  pin(tHide, 1.05); pin(tLie, 1.05);
  if (t < 3.6) tHide.userData.pop((t - 0.3) / 0.35); else tLie.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（晴れた日の広場に戻る）
  shotSquare(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotSquare(t, 0) },
  { a: 9, b: 17, f: shotSchool },
  { a: 17, b: 25, f: shotHome },
  { a: 25, b: 33, f: shotRail },
  { a: 33, b: 42, f: shotTheater },
  { a: 42, b: 49, f: shotHut },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '小さな町にやってきた、<br>陽気な男。'],
  [5.6, 9.0, 'ある女性に、<br>ひと目で恋に落ちる。'],
  [9.2, 13.2, '主人公は、いつも明るくて<br>機転がきく男。'],
  [13.2, 17.0, '恋した相手は、<br>小学校の先生。'],
  [17.2, 21.0, 'ふたりは結婚し、<br>息子が生まれる。'],
  [21.0, 25.0, 'でも、戦争の影が<br>しのびよる。'],
  [25.2, 29.0, '家族は、収容所へ<br>送られてしまう。'],
  [29.0, 33.0, '父は、幼い息子を<br>守ると決める。'],
  [33.2, 37.4, '1997年の、<br>イタリア映画。'],
  [37.4, 41.8, 'アカデミー賞で、<br>主演男優賞など3部門。'],
  [42.2, 45.4, 'つらい現実を、<br>息子にさとられないよう。'],
  [45.4, 49.0, 'ひたすら陽気に、<br>うそをつき続ける。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、ライフ・イズ・<br>ビューティフル。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q143', v2: true, answer: 'ライフ・イズ・ビューティフル',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'emotional', seed: 14310,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'bubble'], [9.0, 'whoosh'], [17.0, 'whoosh'], [21.0, 'drone', 0.4], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ライフ・イズ・': 'ライフイズ', 'アカデミー賞': 'アカデミーしょう', 'イタリア映画': 'イタリアえいが', '主演男優賞': 'しゅえんだんゆうしょう', 'やってきた': 'やってきた', '1997年': 'せんきゅうひゃくきゅうじゅうななねん', '送られて': 'おくられて', '生まれる': 'うまれる', '明るくて': 'あかるくて', '聞かせて': 'きかせて', '小学校': 'しょうがっこう', '3部門': 'さんぶもん', '主人公': 'しゅじんこう', '続ける': 'つづける', '決める': 'きめる', '落ちる': 'おちる', '小さな': 'ちいさな', '収容所': 'しゅうようじょ', '当てて': 'あてて', '機転': 'きてん', '陽気': 'ようき', '女性': 'じょせい', '相手': 'あいて', '先生': 'せんせい', '結婚': 'けっこん', '息子': 'むすこ', '戦争': 'せんそう', '家族': 'かぞく', '幼い': 'おさない', '守る': 'まもる', '現実': 'げんじつ', '間に': 'あいだに', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '一目': 'ひとめ', '町': 'まち', '男': 'おとこ', '恋': 'こい', '影': 'かげ', '父': 'ちち' },
    caption: 'この映画のタイトル、わかる？\n小さな町にやってきた、陽気な男。ある女性に、ひと目で恋に落ちる。主人公は、いつも明るくて機転がきく男。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', '映画好き', '名作映画', '洋画'],
  },
});
applyQuizCards({ answer: 'ライフ・イズ・<br>ビューティフル', info: 'U-NEXT｜イタリア映画・117分', answerSize: 104 });
