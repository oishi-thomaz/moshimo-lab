import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards, makeDisc, makeBars, SONG_GREEN } from './quiz-kit.js';

// タイトル当てクイズ #040 高嶺の花子さん（曲・back number・2013年）。曲の回（docs/QUIZ.md の 曲のクイズ）
// 確かめた事実（2026/11/4）：
//   ・CD シングル発売 2013年6月26日（billboard-japan.com/d_news/detail/157299/2 の「2013/6/26 リリース ※CDリリース日」）。back number は3人組
//   ・日本レコード協会のストリーミング認定 ダイヤモンド（5億回以上。2025年3月度。riaj.or.jp/data/st/search/ で「高嶺の花子さん」）
// 物語：曲が描く状況（話したこともない、誰もがあこがれる人に片思い → 暑い季節に頭の中はその人ばかり → となりを歩く自分を想像しては、相手にはもっとすてきな誰かがいると思う）を
//   自分の言葉で作り直したもの。歌詞の言葉・言い回しは使わない（歌詞と見比べて、重なる言葉がないことを確かめた）。音源・ジャケット・歌手の見た目は使わない
// 構成（ヒント6段）：1 誰もがふり返るあこがれの人・ぼくのことは覚えてもいない → 2 話したこともないのに頭の中はあの人 → 3 蝉の声と日ざし・妄想が止まらない
//   → 4 並んで歩く想像・でもとなりにはすてきな誰か → 5 2013年・3人組バンド・ストリーミング5億回 → 6 決め手：手の届かない人を花にたとえる言い方＋女の子の名前

const S = quizStage({ bg: '#8ac4e8', floor: '#c8c0a8', fogNear: 30, fogFar: 110 });
const qs = S.scene;
const R = rng(4040);

const ME = { skin: '#efcfae', hair: '#1d1a19', shirt: '#e8eef4', pants: '#2a3446' };
const HANA = { skin: '#f4d8c0', hair: '#2a1e18', shirt: '#f8f4f0', pants: '#5a8ac8', long: true, skirt: true };
const RIVAL = { skin: '#ecc9a6', hair: '#3a2a20', shirt: '#2a2e3a', pants: '#1c1e24', tie: true };
const BLUE = '#3a8ad8';

// ---------- 1段目. 並木道（x=0）。誰もがふり返る人と、遠くから見るぼく ----------
{ const rd = box(6, 0.04, 40, mat('#d8ccb0')); rd.position.set(0, 0.03, -10); qs.add(rd); }
const TREES1 = []; for (let i = 0; i < 8; i++) { const g = new THREE.Group(); const tr = box(0.22, 2.2, 0.22, mat('#6a4a30')); tr.position.y = 1.1; g.add(tr); const lf = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 10), mat('#4a9a4a')); lf.position.y = 2.9; g.add(lf); g.position.set(i % 2 ? 3.6 : -3.6, 0, 2 - (i >> 1) * 5); qs.add(g); TREES1.push(g); }
const hana1 = makePerson(HANA); hana1.position.set(0.3, 0, -2); qs.add(hana1);
const CROWD = []; for (let i = 0; i < 6; i++) { const p = makePerson({ skin: ['#ecc9a6', '#e8c4a0', '#c8946a'][i % 3], hair: ['#2a2420', '#4a3a2a', '#1a1a1a'][i % 3], shirt: ['#e05a4f', '#3f8f6b', '#f2c14e', '#8e6bbf', '#4fa3d1', '#d8a050'][i], pants: '#2b3346' }); p.position.set((i % 2 ? 1.8 : -1.8) + (R() - 0.5) * 0.4, 0, -0.5 - i * 1.1); p.rotation.y = i % 2 ? -Math.PI / 2 : Math.PI / 2; qs.add(p); CROWD.push(p); }
const me1 = makePerson(ME); me1.position.set(-2.6, 0, 2.4); me1.rotation.y = Math.PI * 0.85; qs.add(me1);
const HEARTS = []; for (let i = 0; i < 6; i++) { const h = new THREE.Mesh(new THREE.ExtrudeGeometry((() => { const sh = new THREE.Shape(); sh.moveTo(0, -0.15); sh.bezierCurveTo(0.25, 0.03, 0.15, 0.21, 0, 0.09); sh.bezierCurveTo(-0.15, 0.21, -0.25, 0.03, 0, -0.15); return sh; })(), { depth: 0.04, bevelEnabled: false }), new THREE.MeshBasicMaterial({ color: '#ff6a9a' })); qs.add(h); HEARTS.push(h); }
const tLook = tag('みんながふり返る', { size: 66, w: 560, bg: '#14161c', sx: 1.7 }); tLook.position.set(0, 2.2, 0.2); qs.add(tLook);
const tMe = tag('ぼくは眼中にない', { size: 60, w: 620, bg: BLUE, sx: 1.8 }); tMe.position.set(-1.6, 2.4, 1.2); qs.add(tMe);

// ---------- 2段目. 教室の机（x=40）。頭の中はあの人 ----------
const KX = 40;
{ const fl = box(10, 0.04, 8, mat('#b89a70')); fl.position.set(KX, 0.02, -1); qs.add(fl); const wl = box(10, 6, 0.2, mat('#e8e4d8')); wl.position.set(KX, 3, -4); qs.add(wl);
  const bd = box(4, 1.6, 0.05, mat('#2a4a3a')); bd.position.set(KX, 2.6, -3.88); qs.add(bd);
  const dk = box(1.1, 0.06, 0.7, mat('#c8a878')); dk.position.set(KX, 0.78, -1.2); qs.add(dk); const dl = box(0.9, 0.74, 0.04, mat('#8a8e96')); dl.position.set(KX, 0.4, -1.5); qs.add(dl);
  for (const x of [-2.2, 2.2]) { const d = box(1.1, 0.06, 0.7, mat('#c8a878')); d.position.set(KX + x, 0.78, -1.6); qs.add(d); } }
const me2 = makePerson(ME); me2.position.set(KX, -0.32, -0.55); me2.rotation.y = Math.PI; me2.userData.legs.forEach(l => l.rotation.x = -1.45); qs.add(me2);
const BUBBLE = new THREE.Group(); BUBBLE.position.set(KX + 0.9, 2.6, -1.0); qs.add(BUBBLE);
{ const b = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 18), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false })); BUBBLE.add(b);
  const mini = makePerson(HANA); mini.scale.setScalar(0.42); mini.position.y = -0.42; BUBBLE.add(mini); BUBBLE.userData.mini = mini;
  for (let i = 0; i < 2; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.1 - i * 0.04, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 })); d.position.set(-0.55 - i * 0.25, -0.8 - i * 0.3, 0); BUBBLE.add(d); } }
const tTalk = tag('話したことは ほぼゼロ', { size: 58, w: 640, bg: '#14161c', sx: 1.8 }); tTalk.position.set(KX, 3.0, -1.4); qs.add(tTalk);
const tHead = tag('頭の中はあの人', { size: 66, w: 520, bg: BLUE, sx: 1.1 }); tHead.position.set(KX + 0.1, 3.15, -1.8); qs.add(tHead);

// ---------- 3段目. まぶしい日ざしの道（x=90）。蝉の木と、ゆらゆらの空気 ----------
const CX = 90;
const SUN = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), new THREE.MeshBasicMaterial({ color: '#fff4c0', fog: false })); SUN.position.set(CX + 6, 16, -40); qs.add(SUN);
const CLOUD = new THREE.Group(); for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(2 + R() * 1.4, 14, 10), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false })); c.position.set(i * 2.4 - 5, R() * 1.2, 0); CLOUD.add(c); } CLOUD.position.set(CX - 8, 9, -42); qs.add(CLOUD);
{ const rd = box(5, 0.04, 40, mat('#9a9a9a')); rd.position.set(CX, 0.03, -10); qs.add(rd); }
const TREES3 = []; for (let i = 0; i < 8; i++) { const g = new THREE.Group(); const tr = box(0.26, 2.6, 0.26, mat('#5a3e28')); tr.position.y = 1.3; g.add(tr); const lf = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10), mat('#3a8a3a')); lf.position.y = 3.4; g.add(lf); g.position.set(CX + (i % 2 ? 3.4 : -3.4), 0, 2 - (i >> 1) * 5.5); qs.add(g); TREES3.push(g); }
const me3 = makePerson(ME); me3.position.set(CX, 0, 0); me3.rotation.y = Math.PI; qs.add(me3);
const WAVES = []; for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.04), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35 })); w.position.set(CX, 0.4 + i * 0.3, -4 - i); qs.add(w); WAVES.push(w); }
const DREAMS = []; for (let i = 0; i < 3; i++) { const b = new THREE.Group(); const s = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 12), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.4, depthWrite: false })); b.add(s); const m = makePerson(HANA); m.scale.setScalar(0.24); m.position.y = -0.22; b.add(m); qs.add(b); DREAMS.push(b); }
const tSun = tag('まぶしい日ざし', { size: 68, w: 500, bg: '#f2a840', color: '#14161c', sx: 1.8 }); tSun.position.set(CX, 3.0, -1.5); qs.add(tSun);
const tDream = tag('妄想が止まらない', { size: 62, w: 560, bg: BLUE, sx: 1.8 }); tDream.position.set(CX, 3.0, -1.5); qs.add(tDream);

// ---------- 4段目. 想像の中（x=130）。並んで歩くふたり → となりには別の誰か ----------
const BX = 130;
{ const fl = new THREE.Mesh(new THREE.CircleGeometry(5, 40), mat('#f4d8e4')); fl.rotation.x = -Math.PI / 2; fl.position.set(BX, 0.03, -1); qs.add(fl); }
const PETALS = []; for (let i = 0; i < 30; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.06, 6), new THREE.MeshBasicMaterial({ color: '#ff9ac0', side: THREE.DoubleSide })); p.userData.o = R(); p.userData.x = R(); qs.add(p); PETALS.push(p); }
const me4 = makePerson(ME); me4.position.set(BX + 0.4, 0, -1); me4.rotation.y = Math.PI; qs.add(me4);
const hana4 = makePerson(HANA); hana4.position.set(BX - 0.4, 0, -1); hana4.rotation.y = Math.PI; qs.add(hana4);
const rival4 = makePerson(RIVAL); rival4.scale.setScalar(1.08); rival4.position.set(BX - 1.2, 0, -1); rival4.rotation.y = Math.PI; qs.add(rival4);
const tWalk = tag('並んで歩く想像', { size: 64, w: 520, bg: '#14161c', sx: 1.6 }); tWalk.position.set(BX, 2.75, -0.6); qs.add(tWalk);
const tOther = tag('となりには別の誰か', { size: 60, w: 600, bg: BLUE, sx: 1.7 }); tOther.position.set(BX, 2.75, -0.6); qs.add(tOther);

// ---------- 5段目. 2013年・3人組バンド・ストリーミング5億回（x=170） ----------
const FX = 170;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1e2a40' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const DISC = makeDisc(SONG_GREEN); DISC.position.set(FX, 3.2, -1.6); qs.add(DISC);
const BARS = makeBars(11, SONG_GREEN); BARS.position.set(FX, 4.35, -1.4); BARS.scale.set(0.8, 0.4, 0.8); qs.add(BARS);
const tYear = tag('2013年 3人組バンドの曲', { size: 56, w: 720, bg: '#e6b450', color: '#14161c', sx: 3.0 }); tYear.position.set(FX, 5.6, -1.2); qs.add(tYear);
const tPlay = tag('ストリーミング 5億回超え', { size: 56, w: 740, bg: SONG_GREEN, sx: 3.0 }); tPlay.position.set(FX, 5.6, -1.2); qs.add(tPlay);

// ---------- 6段目. 高い岩の上に咲く花（x=210）。下から見上げるぼく ----------
const NX = 210;
const ROCK = new THREE.Group(); ROCK.position.set(NX, 0, -3); qs.add(ROCK);
{ const r1 = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 6, 7), mat('#7a7468')); r1.position.y = 3; ROCK.add(r1); const r2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 1.4, 7), mat('#8a8478')); r2.position.y = 6.7; ROCK.add(r2); }
const FLOWER = new THREE.Group(); FLOWER.position.set(NX, 7.3, -3); FLOWER.scale.setScalar(2.2); qs.add(FLOWER);
{ const st = box(0.04, 0.5, 0.04, mat('#3a8a3a')); st.position.y = 0.25; FLOWER.add(st); for (let i = 0; i < 6; i++) { const pt = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff7aa8' })); const a = i / 6 * Math.PI * 2; pt.position.set(Math.cos(a) * 0.18, 0.55, Math.sin(a) * 0.18); pt.scale.set(1, 0.5, 1); FLOWER.add(pt); } const c = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat('#ffd84a')); c.position.y = 0.58; FLOWER.add(c); }
const me6 = makePerson(ME); me6.position.set(NX + 0.6, 0, 0); me6.rotation.y = Math.PI; qs.add(me6);
const tReach = tag('手の届かない花', { size: 64, w: 520, bg: '#e6b450', color: '#14161c', sx: 2.4 }); tReach.position.set(NX + 1.3, 4.6, 0.2); qs.add(tReach);
const tName = tag('＋ 女の子の名前', { size: 62, w: 540, bg: SONG_GREEN, sx: 2.4 }); tName.position.set(NX + 1.3, 3.7, 0.2); qs.add(tName);

// ---------- shots ----------
const ALL = [tLook, tMe, tTalk, tHead, tSun, tDream, tWalk, tOther, tYear, tPlay, tReach, tName];
function base() { S.reset(); ALL.forEach(x => x.visible = false); HEARTS.forEach(h => h.visible = false); DREAMS.forEach(b => b.visible = false); }
function walk(p, t, k = 1) { const ph = t * 7; p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.35 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.35 * k; }

function shotAvenue(t) { // 1段目 0〜9：誰もがふり返る、あこがれの人がいる。ぼくのことなんて、たぶん覚えてもいない（0秒目がサムネ）
  base(); S.aim(0, -2); lift(-40); S.hemi.intensity = 1.3;
  hana1.position.z = -2 + t * 0.45; walk(hana1, t, 0.8); hana1.userData.head.rotation.y = Math.sin(t * 0.8) * 0.2;
  CROWD.forEach((p, i) => { const dz = hana1.position.z - p.position.z; p.userData.head.rotation.y = clamp(dz * 0.6, -1.0, 1.0) * (i % 2 ? -1 : 1); });
  HEARTS.forEach((h, i) => { h.visible = true; const k = (t * 0.4 + i / 6) % 1; h.position.set(CROWD[i].position.x * 0.7, 1.9 + k * 1.2, CROWD[i].position.z); h.scale.setScalar(Math.sin(k * Math.PI)); });
  me1.userData.head.rotation.y = -0.2; me1.userData.arms[0].rotation.x = t > 5 ? -0.3 : 0;
  tLook.position.z = hana1.position.z + 0.2; tLook.userData.pop(1); if (t > 4.6) tLook.visible = false;
  tMe.userData.pop((t - 4.8) / 0.35);
  const u = ease(t / 9);
  look(lerp(-1.6, -2.4, u), lerp(2.0, 2.2, u), lerp(5.6, 6.0, u), lerp(0, -1.2, u), 1.5, lerp(-1.6, 0.4, u), 56);
  return qs;
}
function shotDesk(t) { // 2段目 9〜17：話したことは、ほとんどない。なのに、気づけば頭の中はあの人ばかり
  base(); S.aim(KX, -2); lift(-40); S.hemi.intensity = 1.25;
  me2.userData.arms[0].rotation.x = -1.2; me2.userData.arms[1].rotation.x = -2.2; me2.userData.head.rotation.x = 0.15;
  const k = ease(clamp((t - 4.2) / 0.6)); BUBBLE.visible = t > 4.2; BUBBLE.scale.setScalar(Math.max(0.01, k)); BUBBLE.userData.mini.rotation.y = Math.sin(t * 1.5) * 0.5;
  tTalk.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tTalk.visible = false;
  tHead.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(KX + lerp(-0.6, -0.3, u), lerp(2.1, 2.0, u), lerp(2.6, 2.2, u), KX + 0.2, 1.7, -1.2, 56);
  return qs;
}
function shotSummer(t) { // 3段目 17〜25：蝉の声と、まぶしい日ざし。暑さのせいか、妄想が止まらない
  base(); S.aim(CX, -4); lift(-20); S.hemi.intensity = 1.5; S.key.intensity = 1.9;
  me3.position.z = -t * 0.4; walk(me3, t, 0.7); me3.userData.head.rotation.x = -0.2;
  WAVES.forEach((w, i) => { w.position.z = me3.position.z - 3 - i; w.position.y = 0.4 + i * 0.3 + Math.sin(t * 3 + i) * 0.06; w.scale.x = 1 + Math.sin(t * 2 + i) * 0.1; });
  DREAMS.forEach((b, i) => { const k = ease(clamp((t - 4.2 - i * 0.4) / 0.5)); b.visible = k > 0; b.scale.setScalar(Math.max(0.01, k)); b.position.set(CX + [-0.9, 0.9, 0][i], 2.3 + [0, 0.25, 0.75][i] + Math.sin(t * 2 + i) * 0.06, me3.position.z - 0.3); });
  tSun.position.z = -1.5 - t * 0.4; tDream.position.z = -1.5 - t * 0.4;
  tSun.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tSun.visible = false;
  tDream.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(CX + 0.3, lerp(1.5, 1.7, u), 3.4 - t * 0.4, CX, lerp(2.2, 2.6, u), -6 - t * 0.4, 60);
  return qs;
}
function shotDream(t) { // 4段目 25〜33：並んで歩く自分を、何度も想像してしまう。でも、となりにいるのは、たぶん、もっとすてきな誰か
  base(); S.aim(BX, -2); lift(-40); S.hemi.intensity = 1.3; S.darken(0.3, '#f4c8dc');
  const sw = ease(clamp((t - 4.2) / 1.2));
  me4.position.set(BX + lerp(0.4, 1.6, sw), 0, -1); me4.rotation.y = Math.PI - sw * 0.6; me4.userData.head.rotation.x = sw * 0.3;
  rival4.position.x = BX + lerp(-3.6, 0.45, sw); rival4.visible = t > 4.2; walk(rival4, t, 1 - sw);
  hana4.userData.head.rotation.y = lerp(-0.35, 0.4, sw); me4.userData.head.rotation.y = lerp(0.35, 0, sw);
  PETALS.forEach(p => { const k = (t * 0.12 + p.userData.o) % 1; p.position.set(BX - 3 + p.userData.x * 6, 4 - k * 4, -2 + Math.sin(k * 6 + p.userData.x * 5) * 1.2); p.rotation.set(k * 6, k * 4, 0); });
  tWalk.userData.pop((t - 0.6) / 0.35); if (t > 4.0) tWalk.visible = false;
  tOther.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(0, 0.2, u), lerp(1.7, 1.8, u), lerp(4.2, 3.8, u), BX, 1.3, -1, 56);
  return qs;
}
function shotFacts(t) { // 5段目 33〜42：2013年に発売された、3人組バンドの曲。ストリーミングでは、5億回を超えた
  base(); S.aim(FX, 0); lift(-30); S.hemi.intensity = 1.1;
  DISC.rotation.z = -t * 2.2; BARS.userData.update(t);
  tYear.userData.pop((t - 0.5) / 0.35); if (t > 4.2) tYear.visible = false;
  tPlay.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 9);
  look(FX, 3.4, lerp(7.8, 7.2, u), FX, 3.5, -1.5, 56);
  return qs;
}
function shotPeak(t, quiz = 0) { // 6段目 42〜49（決め手）：とても手の届かない相手を、花にたとえる言い方がある。そこに、女の子の名前をくっつけたタイトル
  base(); S.aim(NX, -2); lift(-30); S.hemi.intensity = 1.3;
  me6.userData.head.rotation.x = -0.7; me6.userData.arms[1].rotation.x = -2.6 + Math.sin(t * 2) * 0.1;
  FLOWER.rotation.y = t * 0.6; FLOWER.rotation.z = Math.sin(t * 1.4) * 0.08;
  if (!quiz) { tReach.userData.pop((t - 0.4) / 0.35); tName.userData.pop((t - 3.4) / 0.35); }
  const u = ease(t / 7);
  if (!quiz) look(NX + lerp(2.6, 2.3, u), lerp(1.6, 1.5, u), lerp(7.4, 7.0, u), NX + 0.3, lerp(4.0, 4.4, u), -3, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この曲、わかった？
  shotPeak(t + 3, 1);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.3, 0.5, d); S.darken(0.5 * d, '#0a0e18');
  S.spot.color.set(0xffe8f0); S.spot.position.set(NX, 12, 1); S.spot.target.position.set(NX, 7.4, -3); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(NX + lerp(-2.4, -2.0, k), lerp(1.5, 1.4, k), lerp(7.4, 7.0, k), NX + 0.3, lerp(4.2, 4.6, k), -3, 62);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotAvenue },
  { a: 9, b: 17, f: shotDesk },
  { a: 17, b: 25, f: shotSummer },
  { a: 25, b: 33, f: shotDream },
  { a: 33, b: 42, f: shotFacts },
  { a: 42, b: 49, f: (t) => shotPeak(t, 0) },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '誰もがふり返る、<br>あこがれの人がいる。'],
  [5.6, 9.0, 'ぼくのことなんて、<br>たぶん覚えてもいない。'],
  [9.2, 13.2, '話したことは、<br>ほとんどない。'],
  [13.2, 17.0, 'なのに、気づけば<br>頭の中はあの人ばかり。'],
  [17.2, 21.0, '蝉の声と、<br>まぶしい日ざし。'],
  [21.0, 25.0, '暑さのせいか、<br>妄想が止まらない。'],
  [25.2, 29.0, '並んで歩く自分を、<br>何度も想像してしまう。'],
  [29.0, 33.0, 'でも、となりにいるのは、<br>たぶん、もっとすてきな誰か。'],
  [33.2, 37.4, '2013年に発売された、<br>3人組バンドの曲。'],
  [37.4, 41.8, 'ストリーミングでは、<br>5億回を超えた。'],
  [42.2, 45.4, '手の届かない相手を、<br>花にたとえる言い方がある。'],
  [45.4, 49.0, 'そこに、女の子の名前を<br>くっつけたタイトル。'],
  [49.2, 52.0, 'この曲、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、back numberの、高嶺の花子さん。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q040', v2: true, answer: '高嶺の花子さん', kind: '曲',
    title: 'この曲のタイトルは？',
    titleHtml: 'この曲の<br>タイトルは？',
    mood: 'hopeful', seed: 4040,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 5.0, 13.2, 17.4, 21.4, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [13.4, 'bubble'], [17.0, 'whoosh'], [21.2, 'bubble'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'bubble'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { 'back number': 'バックナンバー', '高嶺の花子さん': 'たかねのはなこさん', '誰もが': 'だれもが', '覚えて': 'おぼえて', '蝉の声': 'せみのこえ', '日ざし': 'ひざし', '暑さ': 'あつさ', '妄想': 'もうそう', '並んで': 'ならんで', '何度も': 'なんども', '想像': 'そうぞう', '誰か': 'だれか', '2013年': 'にせんじゅうさんねん', '3人組': 'さんにんぐみ', '5億回': 'ごおくかい', '手の届かない': 'てのとどかない', '何秒': 'なんびょう' },
    caption: 'この曲のタイトル、わかる？\n誰もがふり返る、あこがれの人がいる。ぼくのことなんて、たぶん覚えてもいない。話したことは、ほとんどない。\n\n曲が描いている物語を、オリジナルの文で作り直したクイズ。答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', '曲当てクイズ', '名曲', '邦楽', '片思いソング'],
  },
});
applyQuizCards({ answer: '高嶺の花子さん', info: 'back number｜2013年', answerSize: 112, kind: '曲' });
