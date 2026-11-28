import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard, cam } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #152 ラブ・アクチュアリー（映画・イギリス・アメリカ・フランス合作・2003年製作・135分。U-NEXT で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/love-actually（「ラブ・アクチュアリー」は U-NEXT で配信中）と
//   Filmarks の動画配信欄（U-NEXT 見放題。2026年10月更新）で2026/11/28確認。Filmarks 3.8・レビュー134,320件 filmarks.com/movies/20690）
// 確かめた事実（2026/11/28）：
//   ・映画.com eiga.com/movie/1115 ：2003年製作／135分／イギリス・アメリカ・フランス合作。「ブリジット・ジョーンズの日記」などの脚本家が初メガホンをとり、
//     クリスマス前のロンドンを舞台に様々な境遇の人々が織りなす恋愛模様をつづった群像ラブコメディ。クリスマスを前に浮き足立つロンドン。
//     首相に就任したばかりの男は秘書に一目ぼれしてしまう。妻を亡くした男は、妻の連れ子に元気がないことを心配していた。親友と結婚した女性にひそかに
//     恋心を抱く男。恋人に裏切られた作家は、言葉の通じないポルトガル人のメイドに惹かれていく。2024年12月、日本公開20周年を記念してリバイバル公開
//   ・Filmarks：ロンドンを舞台に、クリスマス直前の男女19人の恋模様をそれぞれの視点から描いていくラブストーリー
// 構成（ヒント6段）：1 雪の街角で、ふと目が合う・ひと目ぼれしてしまう → 2 主人公はひとりじゃない・恋に悩むたくさんの男女
//   → 3 クリスマス直前の大きな街・どこもかしこも浮き足立つ → 4 言葉の通じない相手に恋をする人・親友の妻をひそかに想う人
//   → 5 2003年のイギリス映画・クリスマスの定番ラブストーリー → 6 決め手：首相になったばかりの男が秘書にひと目ぼれ・ロンドンで交差する19人の恋
// それぞれの恋の結末は言わない。登場人物の名前は出さない。俳優の顔・ポスター・ロゴは使わない。有名な場面の構図（玄関先で文字のカードをめくる告白・
// 首相の官邸でのダンス・空港の到着ロビーの抱擁など）はなぞらない。国旗や実在の建物も使わない。人は汎用の3D
const S = quizStage({ bg: '#1a2034', floor: '#d8dce4', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(15210);

const MAN = { skin: '#f1c9a5', hair: '#6a4a2a', shirt: '#2a3a5a', pants: '#2a2a30' };
const WOM = { skin: '#f4d3b5', hair: '#3a2418', shirt: '#b8323a', pants: '#2a2a30', long: true, skirt: true };
const PPL = [
  { skin: '#f1c9a5', hair: '#2a2018', shirt: '#3a5a3a', pants: '#2a2a30' }, { skin: '#e8c09a', hair: '#c89a5a', shirt: '#8a3a4a', pants: '#2a2a30', long: true, skirt: true },
  { skin: '#c89a78', hair: '#1a1410', shirt: '#4a4a7a', pants: '#2a2a30' }, { skin: '#f4d3b5', hair: '#6a3a1a', shirt: '#d8b048', pants: '#3a3030', long: true },
  { skin: '#f1c9a5', hair: '#d8d0c0', shirt: '#5a3a2a', pants: '#2a2a30' }, { skin: '#e0b08a', hair: '#2a1a10', shirt: '#2a6a7a', pants: '#2a2a30', long: true, skirt: true }];
const PM = { skin: '#f1c9a5', hair: '#7a5a3a', shirt: '#1a1e2a', pants: '#1a1e2a', tie: true };
const SEC = { skin: '#f4d3b5', hair: '#4a2a1a', shirt: '#e8e0d0', pants: '#3a3a44', long: true, skirt: true };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0, y = 0) { const p = makePerson(o); p.position.set(x, y, z); p.rotation.y = ry; qs.add(p); return p; }
const _f = new THREE.Vector3(), _u = new THREE.Vector3();
function pin(sp, up = 1.0, d = 3.4) { cam.updateMatrixWorld(); cam.getWorldDirection(_f); _u.set(0, 1, 0).applyQuaternion(cam.quaternion); sp.position.copy(cam.position).addScaledVector(_f, d).addScaledVector(_u, up); }
function heart(c = '#e24050', s = 0.3) { const sh = new THREE.Shape(); sh.moveTo(0, -0.5); sh.bezierCurveTo(-0.9, 0.1, -0.5, 0.75, 0, 0.35); sh.bezierCurveTo(0.5, 0.75, 0.9, 0.1, 0, -0.5);
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: false }), new THREE.MeshBasicMaterial({ color: c })); m.scale.setScalar(s); return m; }
function snow(cx, n = 260) { const g = new THREE.BufferGeometry(); const a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = cx - 8 + R() * 16; a[i * 3 + 1] = R() * 7; a[i * 3 + 2] = -14 + R() * 16; }
  g.setAttribute('position', new THREE.BufferAttribute(a, 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 5, sizeAttenuation: false, fog: false })); p.userData.base = a.slice(); qs.add(p); return p; }
function fall(p, t) { const a = p.geometry.attributes.position, b = p.userData.base; for (let i = 0; i < a.count; i++) { a.array[i * 3 + 1] = ((b[i * 3 + 1] - t * 0.6) % 7 + 7) % 7; a.array[i * 3] = b[i * 3] + Math.sin(t + i) * 0.15; } a.needsUpdate = true; }
function shops(cx, side, n = 5) { for (let i = 0; i < n; i++) { const h = 3.5 + R() * 2; const b = box(3.2, h, 4, mat(['#6a4a3a', '#4a5a6a', '#7a6a4a', '#5a3a4a'][i % 4])); b.position.set(cx + side * 4.6, h / 2, -2 - i * 4.6); qs.add(b);
  const w = box(0.05, 1.4, 2.4, gl(i % 2 ? '#ffd890' : '#ffe8b8')); w.position.set(cx + side * 2.98, 1.1, -2 - i * 4.6); qs.add(w);
  for (let k = 0; k < 6; k++) { const bl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), gl(['#ff5050', '#50ff80', '#ffd040', '#50a0ff'][k % 4])); bl.position.set(cx + side * 3.0, 2.3 + Math.sin(k) * 0.1, -3.1 - i * 4.6 + k * 0.45); qs.add(bl); } } }
function gift(c) { const g = new THREE.Group(); const b = box(0.3, 0.26, 0.3, mat(c)); g.add(b); const r1 = box(0.31, 0.27, 0.05, mat('#f0e0a0')); g.add(r1); const r2 = box(0.05, 0.27, 0.31, mat('#f0e0a0')); g.add(r2); return g; }

// ---------- 1段目. 雪の夜の街角（x=0）。明かりのともった店、すれちがう男女、ふりかえる男、ポンと出るハート ----------
shops(0, -1); shops(0, 1);
const SNOW1 = snow(0);
{ const lp = box(0.1, 3.4, 0.1, mat('#2a2a2a')); lp.position.set(-1.8, 1.7, -4); qs.add(lp); const lh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), gl('#ffe0a0')); lh.position.set(-1.8, 3.45, -4); qs.add(lh);
  const L = new THREE.PointLight('#ffd8a0', 3, 10); L.position.set(-1.6, 3.2, -3.6); qs.add(L); }
const MAN1 = person(MAN, -0.4, -6, 0);
const WOM1 = person(WOM, 0.6, -1.2, Math.PI);
const HEART1 = heart(); HEART1.position.set(-0.4, 2.3, -3.5); qs.add(HEART1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tEyes = tag('雪の街角で、ふと目が合う', { size: 50, w: 780, bg: '#14161c', sx: 1.85 }); qs.add(tEyes);
const tFall = tag('ひと目ぼれ、してしまう', { size: 54, w: 680, bg: '#e24050', sx: 1.7 }); qs.add(tFall);

// ---------- 2段目. 雪の広場（x=50）。あちこちにいる男女、それぞれの頭の上にハートや割れたハートや「？」 ----------
const AX = 50;
const SNOW2 = snow(AX);
{ const fn = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.6, 24), mat('#8a8a90')); fn.position.set(AX, 0.3, -6); qs.add(fn);
  for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 10), mat('#2a5a3a')); t.position.set(AX - 6 + i * 2.4, 0.9, -10); qs.add(t); } }
const PAIR2 = []; const ICON2 = [];
[[-2.2, -3.0], [0.0, -2.2], [2.2, -3.2], [-1.2, -5.4], [1.4, -5.8], [-3.0, -6.6]].forEach(([x, z], i) => { const p = person(PPL[i], AX + x, z, (i % 2 ? -0.5 : 0.5)); PAIR2.push(p);
  const ic = i % 3 === 2 ? tag('？', { size: 70, w: 110, h: 110, bg: '#3478e6', sx: 0.5 }) : heart(i % 3 === 1 ? '#8a8aa0' : '#e24050', 0.4); if (i % 3 === 1) ic.scale.x *= 0.8;
  ic.position.set(AX + x, 2.25, z); if (ic.userData.pop) { ic.renderOrder = 6; } qs.add(ic); ICON2.push(ic); });
const tNotOne = tag('主人公は、ひとりじゃない', { size: 52, w: 720, bg: '#14161c', sx: 1.75 }); qs.add(tNotOne);
const tMany = tag('恋に悩む、たくさんの男女', { size: 50, w: 760, bg: '#e24050', sx: 1.8 }); qs.add(tMany);

// ---------- 3段目. クリスマス直前の大通り（x=100）。大きなツリー、電飾、プレゼントを抱えて急ぐ人たち ----------
const BX = 100;
shops(BX, -1, 6); shops(BX, 1, 6);
const SNOW3 = snow(BX);
const TREE3 = new THREE.Group(); { for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(2.0 - i * 0.42, 2.0, 14), mat('#1e5a32')); c.position.y = 1.4 + i * 1.2; TREE3.add(c); }
  const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), gl('#ffd040')); st.position.y = 6.3; TREE3.add(st);
  for (let i = 0; i < 40; i++) { const a = R() * Math.PI * 2, h = R(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), gl(['#ff5050', '#ffd040', '#50a0ff', '#ffffff'][i % 4])); b.position.set(Math.cos(a) * (1.9 - h * 1.6), 0.8 + h * 5, Math.sin(a) * (1.9 - h * 1.6)); TREE3.add(b); } }
TREE3.position.set(BX, 0, -12); qs.add(TREE3);
const L3 = new THREE.PointLight('#ffd8a0', 4, 16); L3.position.set(BX, 3, -9); qs.add(L3);
const WALK3 = [0, 1, 2, 3, 4].map(i => { const p = person(PPL[i], BX + (i % 2 ? 1.3 : -1.3) + (i - 2) * 0.2, -3 - i * 1.8, i % 2 ? Math.PI : 0); const g = gift(['#e24050', '#3478e6', '#e6b450', '#3aa860', '#a050c0'][i]); g.position.set(0, -0.5, 0.18); p.userData.arms[1].add(g); return p; });
const tXmas = tag('クリスマス直前の、大きな街', { size: 48, w: 820, bg: '#14161c', sx: 1.85 }); qs.add(tXmas);
const tBuzz = tag('どこもかしこも、浮き足立つ', { size: 50, w: 780, bg: '#e24050', sx: 1.85 }); qs.add(tBuzz);

// ---------- 4段目. 左：湖畔の家で身ぶり手ぶりの二人（記号の吹き出し）／右：にぎやかな式のあと、柱の陰から見つめる男 ----------
const CX = 150;
{ const fl = box(14, 0.04, 12, mat('#c8ccd4')); fl.position.set(CX, 0.02, -4); qs.add(fl);
  const wl = box(14, 4, 0.3, mat('#d8c8a8')); wl.position.set(CX, 2, -9); qs.add(wl);
  const pl = box(0.6, 4, 0.6, mat('#e8e0d0')); pl.position.set(CX + 2.0, 2, -3.2); qs.add(pl);
  for (let i = 0; i < 3; i++) { const w = box(1.2, 1.4, 0.05, gl('#a8c8e8')); w.position.set(CX - 4.8 + i * 1.6, 2.0, -8.82); qs.add(w); }
  const lt = new THREE.PointLight('#fff0d8', 2.6, 14); lt.position.set(CX, 3.4, -3); qs.add(lt); }
const WRT4 = person(MAN, CX - 3.6, -4.6, 0.7); const MAID4 = person({ ...PPL[3], shirt: '#2a2a30', skirt: true }, CX - 2.4, -4.4, -0.7);
const BUB4 = [tag('♪？', { size: 54, w: 160, h: 110, bg: '#ffffff', color: '#14161c', sx: 0.42 }), tag('！？', { size: 54, w: 160, h: 110, bg: '#ffffff', color: '#14161c', sx: 0.42 })];
BUB4.forEach(b => qs.add(b));
const GROOM4 = person({ ...MAN, shirt: '#1a1a1e', tie: true }, CX + 4.2, -6.0, -0.3); const BRIDE4 = person({ skin: '#f4d3b5', hair: '#c89a5a', shirt: '#ffffff', pants: '#ffffff', long: true, skirt: true }, CX + 5.0, -6.1, -0.5);
const WATCH4 = person({ ...PPL[2], tie: true, shirt: '#2a2a30' }, CX + 2.6, -2.6, -2.4);
const tLang = tag('言葉の通じない相手に、恋をする人', { size: 44, w: 900, bg: '#14161c', sx: 2.0 }); qs.add(tLang);
const tFriend = tag('親友の妻を、ひそかに想う人', { size: 50, w: 780, bg: '#e24050', sx: 1.85 }); qs.add(tFriend);

// ---------- 5段目. 夜の映画館（x=200）。光るスクリーン、赤い座席、雪の結晶とリース ----------
const DX = 200;
{ const fl = box(14, 0.04, 14, mat('#1a1416')); fl.position.set(DX, 0.03, -2); qs.add(fl);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const st = box(0.55, 0.5, 0.5, mat('#8a1a24')); st.position.set(DX - 2.4 + i * 0.6, 0.35 + r * 0.25, -1 + r * 1.0); qs.add(st); const bk = box(0.55, 0.6, 0.12, mat('#7a1620')); bk.position.set(DX - 2.4 + i * 0.6, 0.85 + r * 0.25, -0.76 + r * 1.0); qs.add(bk); } }
const SCREEN5 = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.2), new THREE.MeshBasicMaterial({ color: '#6a7a9a' })); SCREEN5.position.set(DX, 3.0, -7); qs.add(SCREEN5);
const WREATH5 = new THREE.Group(); { const r = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.14, 8, 24), mat('#2a6a3a')); WREATH5.add(r); const bw = box(0.26, 0.16, 0.08, mat('#d82a3a')); bw.position.set(0, -0.5, 0.1); WREATH5.add(bw);
  for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), mat('#d82a3a')); const a = i / 8 * Math.PI * 2; b.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.12); WREATH5.add(b); } }
WREATH5.position.set(DX, 2.1, -3.4); qs.add(WREATH5);
const FLAKE5 = []; for (let i = 0; i < 6; i++) { const f = tag('❄', { size: 80, w: 120, h: 120, bg: 'rgba(0,0,0,0)', color: '#e8f4ff', sx: 0.36 }); f.renderOrder = 6; qs.add(f); FLAKE5.push(f); }
const t2003 = tag('2003年の、イギリス映画', { size: 54, w: 680, bg: '#e6b450', color: '#14161c', sx: 1.65 }); qs.add(t2003);
const tStd = tag('クリスマスの定番ラブストーリー', { size: 46, w: 860, bg: '#e24050', sx: 1.95 }); qs.add(tStd);

// ---------- 6段目. 古い大きな建物の執務室（x=250）。紺のスーツの男と、お茶を運ぶ秘書。窓の外は雪。そのあと街の灯りをつなぐ赤い線 ----------
const EX = 250;
{ const fl = box(9, 0.04, 8, mat('#6a3a2a')); fl.position.set(EX, 0.03, -3); qs.add(fl); const rug = box(4, 0.02, 3, mat('#8a2a2a')); rug.position.set(EX, 0.06, -3.2); qs.add(rug);
  const wl = box(9, 4.2, 0.3, mat('#d8d0b8')); wl.position.set(EX, 2.1, -7); qs.add(wl);
  for (const s of [-1, 1]) { const w = box(1.3, 2.0, 0.05, gl('#3a4a6a')); w.position.set(EX + s * 2.4, 2.2, -6.82); qs.add(w); const fr = box(1.4, 0.1, 0.1, mat('#f0ead8')); fr.position.set(EX + s * 2.4, 1.15, -6.8); qs.add(fr); }
  const dk = box(2.2, 0.8, 1.0, mat('#4a2a1a')); dk.position.set(EX, 0.4, -5.2); qs.add(dk);
  const lt = new THREE.PointLight('#ffe8c8', 2.8, 12); lt.position.set(EX, 3.4, -2.6); qs.add(lt); }
const SNOW6 = snow(EX, 80);
const PM6 = person(PM, EX - 0.8, -4.0, 0.6);
const SEC6 = person(SEC, EX + 0.9, -3.4, -0.9);
const TRAY6 = box(0.5, 0.03, 0.34, mat('#c8c8c8')); TRAY6.position.set(0, -0.62, 0.18); SEC6.userData.arms[1].add(TRAY6); const CUP6 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 10), mat('#ffffff')); CUP6.position.set(0.05, -0.56, 0.18); SEC6.userData.arms[1].add(CUP6);
const HEART6 = heart('#e24050', 0.34); HEART6.position.set(EX - 0.8, 2.4, -4.0); qs.add(HEART6);
const NET6 = new THREE.Group(); { const pts = []; for (let i = 0; i < 19; i++) pts.push(new THREE.Vector3((R() - 0.5) * 4.4, (R() - 0.5) * 2.4, 0));
  pts.forEach((p, i) => { const h = heart(['#e24050', '#ff8aa0', '#ffd040'][i % 3], 0.16); h.position.copy(p); NET6.add(h); });
  for (let i = 0; i < 19; i++) { const a = pts[i], b = pts[(i * 7 + 3) % 19]; const d = a.distanceTo(b); const ln = box(0.02, 0.02, d, gl('#ff8aa0', 0.7)); ln.position.copy(a).add(b).multiplyScalar(0.5); ln.lookAt(b); NET6.add(ln); } }
NET6.position.set(EX, 2.4, -6.6); qs.add(NET6);
const tPM = tag('首相になったばかりの男が、秘書にひと目ぼれ', { size: 40, w: 980, bg: '#14161c', sx: 2.1 }); qs.add(tPM);
const t19 = tag('ロンドンで交差する、19人の恋', { size: 48, w: 820, bg: '#e6b450', color: '#14161c', sx: 1.85 }); qs.add(t19);

// ---------- shots ----------
const ALL = [tEyes, tFall, tNotOne, tMany, tXmas, tBuzz, tLang, tFriend, t2003, tStd, tPM, t19, Q1, ...BUB4, ...FLAKE5];
function base() { S.reset(); ALL.forEach(x => x.visible = false); }

function shotCorner(t, quiz = 0) { // 1段目 0〜9：雪の街角で、ふと目が合う。ひと目ぼれ、してしまう（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 0.7; S.key.intensity = 0.4; S.darken(0.5, '#0a0c18'); fall(SNOW1, t);
  const tt = quiz ? 3.0 : t, met = clamp((tt - 1.0) / 3.0);
  MAN1.position.z = -6 + met * 3.0; WOM1.position.z = -1.2 - met * 2.0; poseWalk(MAN1, tt * 5, met < 1 ? 0.6 : 0); poseWalk(WOM1, tt * 5 + 1, met < 1 ? 0.6 : 0);
  const turn = clamp((tt - 4.2) / 0.8); MAN1.userData.head.rotation.y = turn * 0.9; WOM1.userData.head.rotation.y = -turn * 0.7;
  HEART1.visible = quiz || t > 5.6; HEART1.position.set(-0.4, 2.35 + Math.sin(t * 3) * 0.06, MAN1.position.z); HEART1.scale.setScalar(0.3 * (1 + Math.max(0, Math.sin(t * 6)) * 0.15));
  Q1.position.set(0.1, 2.7, -4.6); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  pin(tEyes, 1.05); pin(tFall, 1.05);
  if (!quiz) { tEyes.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tEyes.visible = false; tFall.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(2.6, 2.3, u), lerp(1.8, 1.7, u), lerp(1.4, 0.8, u), -0.2, 1.3, -3.8, 64);
  return qs;
}
function shotSquare(t) { // 2段目 9〜17：主人公は、ひとりじゃない。恋に悩む、たくさんの男女
  base(); S.aim(AX, -4); lift(0); S.hemi.intensity = 0.8; S.key.intensity = 0.5; S.darken(0.45, '#0a0c18'); fall(SNOW2, t);
  PAIR2.forEach((p, i) => { p.userData.head.rotation.y = Math.sin(t * 0.8 + i) * 0.4; p.userData.head.rotation.x = i % 3 === 1 ? 0.35 : 0; });
  ICON2.forEach((ic, i) => { ic.visible = t > 4.3 + i * 0.15; ic.position.y = 2.25 + Math.sin(t * 2 + i) * 0.06; if (!ic.userData.pop) ic.rotation.y = Math.sin(t + i) * 0.4; else ic.userData.pop(1); });
  const u = ease(t / 8);
  look(AX + lerp(-0.6, 0.6, u), lerp(2.6, 2.4, u), lerp(3.4, 2.8, u), AX, 1.2, -4.2, 64);
  pin(tNotOne, 1.05); pin(tMany, 1.05);
  tNotOne.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tNotOne.visible = false; tMany.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotStreet(t) { // 3段目 17〜25：クリスマス直前の、大きな街。どこもかしこも、浮き足立つ
  base(); S.aim(BX, -6); lift(0); S.hemi.intensity = 0.75; S.key.intensity = 0.4; S.darken(0.5, '#0a0c18'); fall(SNOW3, t);
  WALK3.forEach((p, i) => { const d = i % 2 ? 1 : -1; p.position.z = -3 - i * 1.8 - d * t * 0.6; poseWalk(p, t * 6 + i, 0.9); p.userData.arms[1].rotation.x = -0.9; });
  TREE3.rotation.y = t * 0.15;
  const u = ease(t / 8);
  look(BX + lerp(0.6, -0.4, u), lerp(1.7, 2.0, u), lerp(2.6, 1.8, u), BX, 2.4, -10, 62);
  pin(tXmas, 1.05); pin(tBuzz, 1.05);
  tXmas.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tXmas.visible = false; tBuzz.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTwo(t) { // 4段目 25〜33：言葉の通じない相手に、恋をする人。親友の妻を、ひそかに想う人
  base(); S.aim(CX, -4); lift(0); S.hemi.intensity = 1.0; S.key.intensity = 0.7;
  const second = t > 4.3;
  WRT4.userData.arms[1].rotation.x = -1.0 + Math.sin(t * 4) * 0.4; MAID4.userData.arms[0].rotation.x = -0.9 + Math.sin(t * 4 + 2) * 0.4;
  BUB4[0].position.set(CX - 3.75, 2.15, -4.5); BUB4[1].position.set(CX - 2.25, 2.15, -4.3); BUB4.forEach((b, i) => b.userData.pop(second ? 0 : clamp((t - 0.6 - i * 0.4) / 0.3)));
  BRIDE4.userData.arms[0].rotation.x = -0.4; GROOM4.userData.arms[1].rotation.x = -0.4; WATCH4.userData.head.rotation.y = 0.1; WATCH4.userData.head.rotation.x = Math.sin(t * 0.6) * 0.05;
  const u = ease(clamp((t - (second ? 4.3 : 0)) / 4));
  if (!second) look(CX - 3.0 + lerp(0.2, 0, u), 1.7, lerp(-0.2, -0.8, u), CX - 3.0, 1.35, -4.5, 62);
  else look(CX + lerp(1.3, 1.5, u), 1.8, lerp(0.6, 0.1, u), CX + 4.4, 1.2, -5.8, 62);
  pin(tLang, 1.05); pin(tFriend, 1.05);
  tLang.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tLang.visible = false; tFriend.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotTheater(t) { // 5段目 33〜42：2003年の、イギリス映画。クリスマスの定番ラブストーリー
  base(); S.aim(DX, -3); lift(0); S.hemi.intensity = 0.4; S.key.intensity = 0.2; S.darken(0.8, '#020204');
  SCREEN5.material.color.setHSL(0.6, 0.22, 0.42 + Math.sin(t * 2.3) * 0.06);
  WREATH5.visible = t > 4.3; WREATH5.rotation.y = Math.sin(t) * 0.3;
  FLAKE5.forEach((f, i) => { f.visible = t > 4.3; const s = ((t * 0.25 + i / 6) % 1); f.position.set(DX - 1.6 + i * 0.64, 3.2 - s * 2.4, -3.0); f.material.opacity = 1 - s * 0.6; });
  const u = ease(t / 9);
  look(DX + lerp(-0.4, 0.4, u), lerp(2.4, 2.3, u), lerp(2.4, 1.6, u), DX, 1.8, -4.5, 62);
  pin(t2003, 1.05); pin(tStd, 1.05);
  t2003.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2003.visible = false; tStd.userData.pop((t - 4.3) / 0.35);
  return qs;
}
function shotOffice(t) { // 6段目 42〜49（決め手）：首相になったばかりの男が、秘書にひと目ぼれ。ロンドンで交差する、19人の恋
  base(); S.aim(EX, -4); lift(0); S.hemi.intensity = 0.9; S.key.intensity = 0.6; fall(SNOW6, t);
  const net = t > 3.6;
  PM6.userData.head.rotation.y = 0.5; PM6.userData.arms[1].rotation.x = -0.3; SEC6.userData.arms[1].rotation.x = -1.0;
  HEART6.visible = t > 1.4 && !net; HEART6.scale.setScalar(0.34 * (1 + Math.max(0, Math.sin(t * 6)) * 0.15)); HEART6.position.y = 2.4 + Math.sin(t * 3) * 0.05;
  NET6.visible = net; NET6.children.forEach((c, i) => c.visible = i < 19 ? i < (t - 3.6) * 20 : t > 4.4);
  const u = ease(t / 7);
  if (!net) look(EX + lerp(0.6, 0.3, u), lerp(1.8, 1.7, u), lerp(0.4, -0.4, u), EX, 1.35, -4.0, 62);
  else { const v = ease(clamp((t - 3.6) / 1.0)); look(EX + lerp(0.3, 0, v), lerp(1.7, 2.4, v), lerp(-0.4, -2.2, v), EX, lerp(1.35, 2.4, v), -6.6, 62); }
  pin(tPM, 1.05); pin(t19, 1.05);
  if (t < 3.6) tPM.userData.pop((t - 0.3) / 0.35); else t19.userData.pop((t - 3.7) / 0.3);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（雪の街角に戻る）
  shotCorner(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotCorner(t, 0) },
  { a: 9, b: 17, f: shotSquare },
  { a: 17, b: 25, f: shotStreet },
  { a: 25, b: 33, f: shotTwo },
  { a: 33, b: 42, f: shotTheater },
  { a: 42, b: 49, f: shotOffice },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '雪の街角で、<br>ふと目が合う。'],
  [5.6, 9.0, 'ひと目ぼれ、<br>してしまう。'],
  [9.2, 13.2, '主人公は、<br>ひとりじゃない。'],
  [13.2, 17.0, '恋に悩む、<br>たくさんの男女。'],
  [17.2, 21.0, 'クリスマス直前の、<br>大きな街。'],
  [21.0, 25.0, 'どこもかしこも、<br>浮き足立つ。'],
  [25.2, 29.0, '言葉の通じない相手に、<br>恋をする人。'],
  [29.0, 33.0, '親友の妻を、<br>ひそかに想う人。'],
  [33.2, 37.4, '2003年の、<br>イギリス映画。'],
  [37.4, 41.8, 'クリスマスの定番<br>ラブストーリー。'],
  [42.2, 45.4, '首相になったばかりの男が、<br>秘書にひと目ぼれ。'],
  [45.4, 49.0, 'ロンドンで交差する、<br>19人の恋。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ラブ・アクチュアリー。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q152', v2: true, answer: 'ラブ・アクチュアリー',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 15210,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [5.6, 'bubble'], [9.0, 'whoosh'], [13.2, 'bubble'], [17.0, 'whoosh'], [25.0, 'whoosh'], [29.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [45.4, 'bubble'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'ラブ・アクチュアリー': 'ラブアクチュアリー', 'ラブストーリー': 'ラブストーリー', 'イギリス映画': 'イギリスえいが', '2003年': 'にせんさんねん', '19人': 'じゅうきゅうにん', '雪の街角': 'ゆきのまちかど', '目が合う': 'めがあう', 'ひと目ぼれ': 'ひとめぼれ', '主人公': 'しゅじんこう', '恋に悩む': 'こいになやむ', '男女': 'だんじょ', '直前': 'ちょくぜん', '大きな街': 'おおきなまち', '浮き足立つ': 'うきあしだつ', '言葉': 'ことば', '通じない': 'つうじない', '相手': 'あいて', '恋': 'こい', '親友': 'しんゆう', '妻': 'つま', '想う人': 'おもうひと', '人': 'ひと', '定番': 'ていばん', '首相': 'しゅしょう', '男': 'おとこ', '秘書': 'ひしょ', '交差': 'こうさ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n雪の街角で、ふと目が合う。ひと目ぼれ、してしまう。主人公は、ひとりじゃない。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', '映画好き', '洋画', 'クリスマス映画'],
  },
});
applyQuizCards({ answer: 'ラブ・<br>アクチュアリー', info: 'U-NEXT｜映画・135分', answerSize: 104 });
