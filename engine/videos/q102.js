import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #102 TENET テネット（映画・アメリカ・2020年9月18日公開・150分。Prime Video・Hulu で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/tenet-tenetsuto（Prime Video・Hulu・U-NEXT）と
//   Filmarks の動画配信欄（Prime Video・U-NEXT・Hulu 見放題）で2026/11/17確認。Filmarks 4.0・レビュー236,757件 filmarks.com/movies/83583）
// 確かめた事実（映画ナタリー natalie.mu/eiga/film/181537、リアルサウンド realsound.jp/movie/2020/09/post-626033_3.html の見出し。2026/11/17）：
//   ・特殊部隊に所属する名もなき男が、ある人物からミッションを命じられる。任務は、未来から来る敵と戦い、核戦争以上の脅威となる事態を防ぐこと。鍵は TENET という言葉（ナタリー）
//   ・秘密裏に動くエージェントたちが第3次世界大戦を防ぐ物語。『ダークナイト』『インターステラー』のクリストファー・ノーラン監督（ナタリー）
//   ・時間の逆行が描かれる（リアルサウンドの解説見出し）。TENET は前から読んでも後ろから読んでも同じつづり
//   ・2020年9月18日公開、150分、アメリカ映画（ナタリー）
// 構成（ヒント6段）：1 名前のない男にある任務・手がかりはひとつの言葉だけ → 2 主人公は特殊部隊の男・その名前は明かされない（名もなき男）
//   → 3 敵は未来からやってくる・核戦争より大きな脅威 → 4 秘密のエージェントたち・ねらいは第3次世界大戦を防ぐこと
//   → 5 2020年のアメリカ映画・監督はインターステラーのノーラン → 6 決め手：時間が逆向きに流れる・鍵の言葉は前から読んでも後ろから読んでも同じ
// 協力者の正体・作戦の中身・結末は言わない。人物名・地名・タイトルの文字は出さない。俳優の顔・ポスター・ロゴ・劇中の有名な場面（回転ドア・飛行機の突入など）は使わない。人は汎用の3D
const S = quizStage({ bg: '#10141c', floor: '#1a1e26', fogNear: 24, fogFar: 80 });
const qs = S.scene;
const R = rng(10210);

const HERO = { skin: '#8a5a3a', hair: '#1a1410', shirt: '#2a2e3a', pants: '#1a1a22', tie: true };
const AGENT = [
  { skin: '#f1c9a5', hair: '#c8a050', shirt: '#4a4e5a', pants: '#1a1a22' },
  { skin: '#f4d3b5', hair: '#2c2421', shirt: '#5a2a3a', pants: '#1a1a22', long: true },
  { skin: '#e8b98f', hair: '#9a9a9a', shirt: '#3a3a40', pants: '#1a1a22', tie: true },
];
const ENEMY = { skin: '#d9a57c', hair: '#1a1410', shirt: '#8a1a1a', pants: '#1a1a22' };
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }

// ---------- 1段目. 暗い部屋（x=0）。机の上に1枚の封筒。男が手に取る ----------
{ const fl = box(12, 0.04, 10, mat('#22262e')); fl.position.set(0, 0.02, -2); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#2a2e38')); wl.position.set(0, 2.5, -5); qs.add(wl);
  const tb = box(2.2, 0.08, 1.2, mat('#5a4a3a')); tb.position.set(0, 0.9, -2.6); qs.add(tb);
  const lg = box(0.12, 0.9, 0.12, mat('#3a3028')); lg.position.set(0, 0.45, -2.6); qs.add(lg);
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.4, 16, 1, true), mat('#2a2e38')); lamp.position.set(0, 3.0, -2.6); qs.add(lamp);
  const bl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), gl('#fff0c8')); bl.position.set(0, 2.85, -2.6); qs.add(bl); }
const SPOT1 = new THREE.SpotLight(0xfff0d0, 0, 8, 0.5, 0.4, 1); SPOT1.position.set(0, 2.9, -2.6); SPOT1.target.position.set(0, 0.9, -2.6); qs.add(SPOT1); qs.add(SPOT1.target);
const ENV1 = box(0.6, 0.02, 0.4, mat('#e8dcc0')); qs.add(ENV1);
const SEAL1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 14), mat('#a8202c')); qs.add(SEAL1);
const hero1 = makePerson(HERO); hero1.position.set(0.1, 0, -3.5); hero1.rotation.y = 0; qs.add(hero1);
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#c8202c', sx: 0.42 }); qs.add(Q1);
const tTask = tag('名前のない男に、ある任務', { size: 52, w: 740, bg: '#14161c', sx: 2.0 }); tTask.position.set(0, 2.55, -3.2); qs.add(tTask);
const tWord = tag('手がかりは、ひとつの言葉だけ', { size: 50, w: 780, bg: '#c8202c', sx: 2.0 }); tWord.position.set(0, 2.55, -3.2); qs.add(tWord);

// ---------- 2段目. 夜の作戦（x=50）。黒い装備の隊員たち。先頭が主人公 ----------
const AX = 50;
{ const fl = box(30, 0.04, 30, mat('#1a1e26')); fl.position.set(AX, 0.02, -8); qs.add(fl);
  for (let i = 0; i < 6; i++) { const b = box(3, 6 + R() * 4, 3, mat('#2a2e38')); b.position.set(AX - 8 + i * 3.4, 3, -14); qs.add(b); }
  for (let i = 0; i < 4; i++) { const c = box(1.2, 1.0, 1.2, mat('#3a3e48')); c.position.set(AX + (i % 2 ? 3 : -3), 0.5, -3 - i * 2); qs.add(c); } }
const TEAM2 = []; for (let i = 0; i < 5; i++) { const p = makePerson(i === 0 ? { ...HERO, tie: false, shirt: '#1a1a22' } : { skin: '#c89a78', hair: '#1a1410', shirt: '#1a1a22', pants: '#1a1a22' }); const hm = box(0.46, 0.18, 0.44, mat('#2a2a30')); hm.position.y = 0.48; p.userData.head.add(hm); p.position.set(AX - 1.6 + (i % 3) * 1.2 + (i > 2 ? 0.6 : 0), 0, -2 - Math.floor(i / 3) * 1.4 - (i === 0 ? -0.6 : 0)); p.rotation.y = Math.PI; qs.add(p); TEAM2.push(p); }
const LIGHT2 = []; for (let i = 0; i < 5; i++) { const l = box(0.04, 0.04, 6, gl('#8ab8ff', 0.5)); qs.add(l); LIGHT2.push(l); }
const tSpec = tag('主人公は、特殊部隊の男', { size: 54, w: 700, bg: '#14161c', sx: 2.2 }); qs.add(tSpec);
const tNoName = tag('名前は、ない', { size: 62, w: 440, bg: '#2a6ab0', sx: 1.6 }); qs.add(tNoName);

// ---------- 3段目. 光る門（x=100）。向こう側（未来）から、赤い服の敵が出てくる ----------
const BX = 100;
{ const fl = box(30, 0.04, 30, mat('#1a1e26')); fl.position.set(BX, 0.02, -8); qs.add(fl);
  for (const s of [-1, 1]) { const p = box(0.4, 4, 0.4, mat('#3a3e48')); p.position.set(BX + s * 1.8, 2, -6); qs.add(p); }
  const tp = box(4, 0.4, 0.4, mat('#3a3e48')); tp.position.set(BX, 4.2, -6); qs.add(tp); }
const GATE3 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(160, 200, (g, w, h) => { const gr = g.createRadialGradient(80, 100, 5, 80, 100, 110); gr.addColorStop(0, 'rgba(255,90,70,0.95)'); gr.addColorStop(0.5, 'rgba(200,40,60,0.6)'); gr.addColorStop(1, 'rgba(60,10,30,0.2)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) }));
GATE3.position.set(BX, 2, -6); qs.add(GATE3);
const EN3 = [0, 1, 2].map(i => { const p = makePerson(ENEMY); p.position.set(BX, 0, -6.2); qs.add(p); return p; });
const BOMB3 = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), new THREE.MeshStandardMaterial({ color: '#3a3e48', metalness: 0.6, roughness: 0.4, emissive: '#200808' })); BOMB3.position.set(BX + 3.2, 0.9, -4); qs.add(BOMB3);
const BLINK3 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), gl('#ff3a2a')); BLINK3.position.set(BX + 3.2, 1.85, -4); qs.add(BLINK3);
const tFuture = tag('敵は、未来からやってくる', { size: 54, w: 720, bg: '#14161c', sx: 4.0 }); tFuture.position.set(BX, 5.0, -5.6); qs.add(tFuture);
const tThreat = tag('核戦争より、大きな脅威', { size: 54, w: 700, bg: '#c8202c', sx: 4.0 }); tThreat.position.set(BX, 5.0, -5.6); qs.add(tThreat);

// ---------- 4段目. 作戦室（x=150）。光る地球儀を、4人のエージェントが囲む ----------
const CX = 150;
{ const fl = box(14, 0.04, 12, mat('#1e222a')); fl.position.set(CX, 0.02, -3); qs.add(fl);
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.1, 32), mat('#2a2e38')); tb.position.set(CX, 0.95, -3); qs.add(tb);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.9, 16), mat('#2a2e38')); st.position.set(CX, 0.45, -3); qs.add(st); }
const GLOBE4 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 16), new THREE.MeshBasicMaterial({ wireframe: true, color: '#6ab8ff' })); GLOBE4.position.set(CX, 1.9, -3); qs.add(GLOBE4);
const GCORE4 = new THREE.Mesh(new THREE.SphereGeometry(0.66, 20, 14), gl('#1a3a6a', 0.7)); GCORE4.position.set(CX, 1.9, -3); qs.add(GCORE4);
const DOTS4 = []; for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), gl('#ff5a4a')); d.userData.a = [R() * Math.PI * 2, (R() - 0.5) * 2]; qs.add(d); DOTS4.push(d); }
const CREW4 = [HERO, ...AGENT].map((c, i) => { const p = makePerson(c); const a = i / 4 * Math.PI * 2 + 0.6; p.position.set(CX + Math.cos(a) * 2.1, 0, -3 + Math.sin(a) * 2.1); p.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); qs.add(p); return p; });
const tAgents = tag('秘密のエージェントたち', { size: 56, w: 680, bg: '#14161c', sx: 2.4 }); tAgents.position.set(CX, 3.3, -3); qs.add(tAgents);
const tWW3 = tag('第3次世界大戦を、防げ', { size: 56, w: 680, bg: '#c8202c', sx: 2.4 }); tWW3.position.set(CX, 3.3, -3); qs.add(tWW3);

// ---------- 5段目. 映画館（x=200）。2020年・アメリカ映画。監督ノーラン ----------
const TX = 200;
{ const fl = box(14, 0.04, 14, mat('#2a1a1e')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(14, 8, 0.2, mat('#3a1a22')); wl.position.set(TX, 4, -5); qs.add(wl);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const s = box(0.7, 0.8, 0.6, mat('#8a1a2a')); s.position.set(TX - 2.9 + i * 1.15, 0.4 + r * 0.25, 2.4 + r * 1.1); qs.add(s); } }
const SCR5 = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.6), new THREE.MeshBasicMaterial({ map: canvasTex(720, 360, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#1a3a6a'); gr.addColorStop(0.5, '#0a0e18'); gr.addColorStop(1, '#6a1a1a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, 20); g.lineTo(w / 2, h - 20); g.stroke(); }) }));
SCR5.position.set(TX, 3.6, -4.85); qs.add(SCR5);
const t2020 = tag('2020年の、アメリカ映画', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 4.0 }); t2020.position.set(TX, 6.0, -4.4); qs.add(t2020);
const tNolan = tag('監督は、インターステラーのノーラン', { size: 48, w: 900, bg: '#2a6ab0', sx: 4.6 }); tNolan.position.set(TX, 6.0, -4.4); qs.add(tNolan);

// ---------- 6段目. 夜の通り（x=250）。砂時計の砂が上へ。歩く男が後ろ向きに戻る ----------
const DX = 250;
{ const fl = box(20, 0.04, 20, mat('#2a2e38')); fl.position.set(DX, 0.02, -6); qs.add(fl);
  for (let i = 0; i < 6; i++) { const b = box(3, 5 + (i % 3) * 2, 3, mat('#3a3e4a')); b.position.set(DX - 8 + i * 3.2, 3, -12); qs.add(b); } }
const HG6 = new THREE.Group();
{ const glass = new THREE.MeshStandardMaterial({ color: '#c8e0ff', transparent: true, opacity: 0.25, metalness: 0.1, roughness: 0.1 });
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.0, 20, 1, true), glass); top.rotation.x = Math.PI; top.position.y = 1.5; HG6.add(top);
  const bot = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.0, 20, 1, true), glass); bot.position.y = 0.5; HG6.add(bot);
  for (const y of [0, 2]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 20), mat('#8a6a3a')); c.position.y = y; HG6.add(c); } }
const SANDB6 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 20), mat('#e6c070')); SANDB6.position.y = 0.45; HG6.add(SANDB6);
const SANDT6 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 20), mat('#e6c070')); SANDT6.rotation.x = Math.PI; SANDT6.position.y = 1.55; HG6.add(SANDT6);
const STREAM6 = box(0.04, 0.9, 0.04, mat('#e6c070')); STREAM6.position.y = 1.0; HG6.add(STREAM6);
HG6.position.set(DX - 1.0, 0, -3.8); HG6.scale.setScalar(1.2); qs.add(HG6);
const walker6 = makePerson(HERO); walker6.position.set(DX, 0, -3); qs.add(walker6);
const ARR6 = [0, 1].map(i => { const a = new THREE.Group(); const sh = box(1.0, 0.16, 0.05, gl(i ? '#c8202c' : '#2a6ab0')); a.add(sh); const hd = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.35, 3), gl(i ? '#c8202c' : '#2a6ab0')); hd.rotation.z = (i ? 1 : -1) * Math.PI / 2; hd.position.x = i ? -0.6 : 0.6; a.add(hd); a.position.set(DX + 0.9, 2.7 - i * 0.45, -3.6); qs.add(a); return a; });
const tBack = tag('時間が、逆向きに流れる', { size: 56, w: 680, bg: '#2a6ab0', sx: 3.0 }); tBack.position.set(DX, 3.6, -3.6); qs.add(tBack);
const tPal = tag('鍵の言葉は、逆から読んでも同じ', { size: 52, w: 820, bg: '#c8202c', sx: 3.4 }); tPal.position.set(DX, 3.6, -3.6); qs.add(tPal);

// ---------- shots ----------
const ALL = [tTask, tWord, tSpec, tNoName, tFuture, tThreat, tAgents, tWW3, t2020, tNolan, tBack, tPal, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); SPOT1.intensity = 0; }

function shotRoom(t, quiz = 0) { // 1段目 0〜9：名前のない男に、ある任務が届く。手がかりは、ひとつの言葉だけ（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); S.hemi.intensity = 0.35; S.darken(0.6, '#04050a'); SPOT1.intensity = 30;
  const k = quiz ? 1 : ease(clamp((t - 4.6) / 1.2));
  ENV1.position.set(lerp(0, -0.25, k), lerp(0.95, 1.3, k), lerp(-2.4, -3.0, k)); ENV1.rotation.x = lerp(0, 1.0, k);
  SEAL1.position.set(ENV1.position.x, ENV1.position.y + 0.02 + k * 0.1, ENV1.position.z + k * 0.05); SEAL1.rotation.x = ENV1.rotation.x;
  hero1.userData.arms[1].rotation.x = -k * 1.2; hero1.userData.head.rotation.x = 0.3;
  Q1.position.set(0.75, 1.6, -2.4); Q1.userData.pop(quiz ? 1 : (t - 0.1) / 0.3); if (!quiz && t > 4.6) Q1.visible = false;
  if (!quiz) { tTask.userData.pop((t - 2.0) / 0.35); if (t > 4.6) tTask.visible = false; tWord.userData.pop((t - 4.8) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.9, 0.5, u), lerp(2.2, 2.0, u), lerp(1.0, 0.4, u), 0, 1.4, -3.0, 60);
  return qs;
}
function shotOps(t) { // 2段目 9〜17：主人公は、特殊部隊の男。その名前は、明かされない
  base(); S.aim(AX, -4); lift(0); S.hemi.intensity = 0.45; S.darken(0.5, '#04050a');
  const z = -t * 0.6;
  TEAM2.forEach((p, i) => { p.position.z = -2 - Math.floor(i / 3) * 1.4 + (i === 0 ? 0.6 : 0) + z; poseWalk(p, t * 6 + i, 0.5); p.userData.arms[0].rotation.x = -1.2; });
  LIGHT2.forEach((l, i) => { const p = TEAM2[i]; l.position.set(p.position.x - 0.3, 1.3, p.position.z - 3.0); l.rotation.y = Math.sin(t + i) * 0.1; });
  const h = TEAM2[0];
  tSpec.position.set(h.position.x, 2.6, h.position.z - 0.3); tNoName.position.set(h.position.x, 2.6, h.position.z - 0.3);
  tSpec.userData.pop((t - 0.4) / 0.35); if (t > 4.0) tSpec.visible = false; tNoName.userData.pop((t - 4.3) / 0.35);
  look(h.position.x + 1.0, 1.9, h.position.z - 4.2, h.position.x, 1.4, h.position.z + 1, 62);
  return qs;
}
function shotGate(t) { // 3段目 17〜25：敵は、未来からやってくる。それは、核戦争より大きな脅威
  base(); S.aim(BX, -5); lift(0); S.hemi.intensity = 0.4; S.darken(0.55, '#06040a');
  GATE3.material.opacity = 0.75 + Math.sin(t * 6) * 0.2;
  EN3.forEach((p, i) => { const k = clamp((t - 0.6 - i * 0.6) / 2.4); p.visible = k > 0; p.position.set(BX + (i - 1) * 0.9, 0, -6.2 + k * 3.0); p.rotation.y = 0; poseWalk(p, t * 7 + i, k < 1 ? 0.7 : 0); });
  BLINK3.visible = t > 4 && Math.floor(t * 3) % 2 === 0;
  tFuture.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tFuture.visible = false; tThreat.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(BX + lerp(-0.8, 0.8, u), lerp(2.6, 2.8, u), lerp(4.4, 3.8, u), BX + lerp(0, 1.0, u), 2.0, -5.4, 64);
  return qs;
}
function shotWar(t) { // 4段目 25〜33：秘密のエージェントたち。ねらいは、第3次世界大戦を防ぐこと
  base(); S.aim(CX, -3); lift(0); S.hemi.intensity = 0.45; S.darken(0.5, '#04050a');
  GLOBE4.rotation.y = t * 0.5; GCORE4.rotation.y = t * 0.5;
  DOTS4.forEach((d, i) => { const [a, y] = d.userData.a; d.visible = t > 4.2 + i * 0.2; d.position.set(CX + Math.cos(a + t * 0.5) * 0.72 * Math.sqrt(1 - y * y / 4), 1.9 + y * 0.35, -3 + Math.sin(a + t * 0.5) * 0.72 * Math.sqrt(1 - y * y / 4)); });
  CREW4.forEach((p, i) => p.userData.head.rotation.x = 0.35);
  tAgents.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tAgents.visible = false; tWW3.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + Math.sin(u * 1.0 - 0.5) * 6.2, lerp(3.6, 3.2, u), -3 + Math.cos(u * 1.0 - 0.5) * 6.2, CX, 1.6, -3, 60);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2020年の、アメリカ映画。監督は、インターステラーのクリストファー・ノーラン
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.45; S.darken(0.6, '#08060a');
  t2020.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2020.visible = false; tNolan.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + 0.2, lerp(2.6, 3.0, u), lerp(6.4, 5.6, u), TX, 3.8, -4.8, 66);
  return qs;
}
function shotReverse(t) { // 6段目 42〜49（決め手）：時間が、逆向きに流れる。鍵の言葉は、前から読んでも後ろから読んでも同じ
  base(); S.aim(DX, -4); lift(0); S.hemi.intensity = 0.9; S.darken(0.35, '#04050a');
  const k = clamp(t / 6.5);
  SANDB6.scale.setScalar(Math.max(0.05, 1 - k)); SANDT6.scale.setScalar(Math.max(0.05, k)); STREAM6.visible = k < 0.98;
  const w = lerp(1.8, -0.4, ease(clamp(t / 6.8)));
  walker6.position.set(DX + 0.3 + w * 0.2, 0, -3.4 + w * 0.6); walker6.rotation.y = Math.PI; poseWalk(walker6, -t * 7, 0.7);
  ARR6.forEach((a, i) => { a.visible = t > 3.6; a.position.x = DX + 0.9 + Math.sin(t * 2 + i * Math.PI) * 0.1; });
  if (t < 3.6) tBack.userData.pop((t - 0.3) / 0.35); else tPal.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(-0.2, 0.2, u), 2.2, lerp(4.4, 3.9, u), DX, 1.7, -3.6, 64);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（暗い部屋に戻る）
  shotRoom(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotRoom(t, 0) },
  { a: 9, b: 17, f: shotOps },
  { a: 17, b: 25, f: shotGate },
  { a: 25, b: 33, f: shotWar },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotReverse },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '名前のない男に、<br>ある任務が届く。'],
  [5.6, 9.0, '手がかりは、<br>ひとつの言葉だけ。'],
  [9.2, 13.2, '主人公は、<br>特殊部隊の男。'],
  [13.2, 17.0, 'その名前は、<br>明かされない。'],
  [17.2, 21.0, '敵は、<br>未来からやってくる。'],
  [21.0, 25.0, 'それは、核戦争より<br>大きな脅威。'],
  [25.2, 29.0, '秘密の、<br>エージェントたち。'],
  [29.0, 33.0, 'ねらいは、<br>第3次世界大戦を防ぐこと。'],
  [33.2, 37.4, '2020年の、<br>アメリカ映画。'],
  [37.4, 41.8, '監督は、インターステラーの<br>クリストファー・ノーラン。'],
  [42.2, 45.4, '時間が、<br>逆向きに流れる。'],
  [45.4, 49.0, '鍵の言葉は、前から読んでも<br>後ろから読んでも同じ。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>テネット。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q102', v2: true, answer: 'TENET テネット',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'tension', seed: 10210,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '名前': 'なまえ', '男': 'おとこ', '任務': 'にんむ', '届く': 'とどく', '手がかり': 'てがかり', '言葉': 'ことば', '主人公': 'しゅじんこう', '特殊部隊': 'とくしゅぶたい', '明かされない': 'あかされない', '敵': 'てき', '未来': 'みらい', '核戦争': 'かくせんそう', '大きな': 'おおきな', '脅威': 'きょうい', '秘密': 'ひみつ', '第3次世界大戦': 'だいさんじせかいたいせん', '防ぐ': 'ふせぐ', '2020年': 'にせんにじゅうねん', '映画': 'えいが', '監督': 'かんとく', '時間': 'じかん', '逆向き': 'ぎゃくむき', '流れる': 'ながれる', '鍵': 'かぎ', '前から': 'まえから', '読んでも': 'よんでも', '後ろから': 'うしろから', '同じ': 'おなじ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n名前のない男に、ある任務が届く。手がかりは、ひとつの言葉だけ。主人公は、特殊部隊の男。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'Hulu', '映画好き', '洋画'],
  },
});
applyQuizCards({ answer: 'TENET<br>テネット', info: 'Prime Video・Hulu｜映画・150分', answerSize: 124 });
