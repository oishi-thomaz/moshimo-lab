import * as THREE from 'three';
import { clamp, lerp, ease, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #134 キャッチ・ミー・イフ・ユー・キャン（映画・アメリカ・2002年製作・141分。Prime Video・U-NEXT で見放題、
//   JustWatch 日本版 justwatch.com/jp/映画/kiyatsuchimiihuyukiyan（見放題：Prime Video・U-NEXT・Hulu）と
//   Filmarks の動画配信欄（Prime Video・U-NEXT・Hulu 見放題）で2026/11/23確認。Filmarks 4.0・レビュー246,965件 filmarks.com/movies/13537）
// 確かめた事実（映画.com eiga.com/movie/1031 の解説・あらすじ。2026/11/23）：
//   ・2002年製作／141分／アメリカ。スティーブン・スピルバーグ監督。実在の詐欺師フランク・アバグネイルがモデル
//   ・パイロットや医師になりすまして巨額の詐欺を働いた若き天才詐欺師と、彼を追うFBI捜査官の追跡劇を軽妙なタッチで描く
//   ・1960年代。高校生の主人公は両親の離婚をきっかけに家を飛び出し、生活のため小切手詐欺に手を染める
//   ・パイロットになりすませば簡単に人を騙せることに気づき、各地を飛び回りながら小切手の偽造を繰り返す。やがてFBIのベテラン捜査官が捜査に乗り出す
// 構成（ヒント6段）：1 空港にあらわれた若いパイロット・その制服、どこで手に入れた？ → 2 主人公は高校生・両親の離婚で家を飛び出す
//   → 3 1960年代の華やかな時代・町から町へ飛び回る → 4 小切手をつくって大金を手に・追いかけるのはベテラン捜査官
//   → 5 2002年のアメリカ映画・実在の人物がモデル → 6 決め手：パイロット、医者…何にでもなりすます・世界をまたにかけた追いかけっこ
// つかまるかどうか・結末は言わない。登場人物の名前・航空会社の名前は出さない（制服と機体は無地）。
// 俳優の顔・ポスター・ロゴは使わない。有名な場面の構図はなぞらない。人は汎用の3D
const S = quizStage({ bg: '#d8dce4', floor: '#9a9ca4', fogNear: 28, fogFar: 110 });
const qs = S.scene;
const R = rng(13410);

const PILOT = { skin: '#f1c9a5', hair: '#3a2418', shirt: '#1e2a4a', pants: '#1e2a4a', tie: true };
const TEEN = { skin: '#f1c9a5', hair: '#3a2418', shirt: '#e8e4dc', pants: '#3a3e4a' };
const DAD = { skin: '#e8c0a0', hair: '#5a5a5a', shirt: '#4a4a52', pants: '#2a2a30', tie: true };
const MOM = { skin: '#f4d3b5', hair: '#c8a060', shirt: '#a84a5a', pants: '#6a3a44', long: true, skirt: true };
const AGENT = { skin: '#e8c0a0', hair: '#3a3030', shirt: '#5a4e40', pants: '#3a3228', tie: true };
const DOC = { skin: '#f1c9a5', hair: '#3a2418', shirt: '#f4f4f4', pants: '#d8d8dc' };
const CREW = { skin: '#f4d3b5', hair: '#2a2018', shirt: '#3a6ab0', pants: '#3a6ab0', long: true, skirt: true };
const ETC = [{ skin: '#f1c9a5', hair: '#2a2018', shirt: '#8a6a4a', pants: '#3a3a44' }, { skin: '#eacbb0', hair: '#6a4a2a', shirt: '#5a7a6a', pants: '#3a3a44', long: true, skirt: true }];
function gl(c, o) { return new THREE.MeshBasicMaterial({ color: c, transparent: o != null, opacity: o ?? 1 }); }
function person(o, x, z, ry = 0) { const p = makePerson(o); p.position.set(x, 0, z); p.rotation.y = ry; qs.add(p); return p; }
function pcap(p, c = '#1e2a4a') { const k = box(0.46, 0.1, 0.46, mat(c)); k.position.y = 0.53; p.userData.head.add(k); const b = box(0.46, 0.03, 0.18, mat('#101420')); b.position.set(0, 0.49, 0.29); p.userData.head.add(b); const g = box(0.12, 0.05, 0.02, mat('#e0c060')); g.position.set(0, 0.55, 0.24); p.userData.head.add(g); return k; }
function hat(p) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 20), mat('#3a3228')); b.position.y = 0.5; p.userData.head.add(b); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.18, 20), mat('#3a3228')); t.position.y = 0.6; p.userData.head.add(t); }
function suitcase(p, c = '#6a4a2a') { const s = box(0.5, 0.36, 0.16, mat(c)); s.position.set(0, -0.76, 0.0); p.userData.arms[1].add(s); return s; }
function plane(x, z, ry = 0, s = 1) { const g = new THREE.Group(); const f = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 12, 16), mat('#f0f0f4')); f.rotation.z = Math.PI / 2; f.position.y = 2; g.add(f);
  const n = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 10), mat('#f0f0f4')); n.scale.set(1.6, 1, 1); n.position.set(6, 2, 0); g.add(n);
  const w = box(3, 0.12, 12, mat('#d8dce4')); w.position.set(0.5, 1.6, 0); g.add(w); const tl = box(1.6, 2.2, 0.12, mat('#d8dce4')); tl.position.set(-5.4, 3.2, 0); g.add(tl);
  const st = box(12, 0.25, 1.82, mat('#2a4a8a')); st.position.set(0, 2.1, 0); g.add(st);
  for (let i = 0; i < 12; i++) { const wd = box(0.2, 0.24, 1.84, gl('#2a3440')); wd.position.set(-4.4 + i * 0.8, 2.5, 0); g.add(wd); }
  g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(s); qs.add(g); return g; }

// ---------- 1段目. 空港のロビー（x=0）。人ごみを歩く、制服姿の若いパイロット ----------
{ const fl = box(30, 0.04, 30, mat('#c8c4bc')); fl.position.set(0, 0.02, -8); qs.add(fl);
  for (let i = 0; i < 10; i++) { const t = box(1.4, 0.02, 1.4, mat(i % 2 ? '#b8b4ac' : '#d8d4cc')); t.position.set(-6 + i * 1.4, 0.04, -2); qs.add(t); }
  const gw = new THREE.Mesh(new THREE.PlaneGeometry(26, 7), gl('#a8c8e8')); gw.position.set(0, 3.5, -16); qs.add(gw);
  for (let i = 0; i < 9; i++) { const fr = box(0.2, 7, 0.2, mat('#6a6e78')); fr.position.set(-12 + i * 3, 3.5, -15.9); qs.add(fr); }
  const bd = box(4, 1.2, 0.2, mat('#2a2e38')); bd.position.set(3.5, 4.4, -10); qs.add(bd);
  for (let r = 0; r < 4; r++) { const ln = box(3.4, 0.1, 0.02, gl(['#f0c040', '#e0e0e0'][r % 2])); ln.position.set(3.5, 4.8 - r * 0.25, -9.88); qs.add(ln); } }
const PL1 = plane(-3, -26, 0.3, 1.2);
const P1 = person(PILOT, 0.2, -1.6, Math.PI); pcap(P1); suitcase(P1, '#2a2a30');
const CREW1 = [person(CREW, -1.3, -0.6, Math.PI), person(CREW, 1.6, -0.4, Math.PI)];
const CROWD1 = []; for (let i = 0; i < 10; i++) CROWD1.push(person(ETC[i % 2], -5 + R() * 10, -4 - R() * 8, R() > 0.5 ? 0 : Math.PI));
const Q1 = tag('？', { size: 100, w: 140, h: 140, bg: '#e24050', sx: 0.5 }); qs.add(Q1);
const tPilot = tag('空港にあらわれた、若いパイロット', { size: 46, w: 860, bg: '#14161c', sx: 1.5 }); qs.add(tPilot);
const tUni = tag('その制服、どこで手に入れた？', { size: 48, w: 820, bg: '#e24050', sx: 1.45 }); qs.add(tUni);

// ---------- 2段目. 家のリビング（x=50）。言い争う両親。かばんを持って玄関を出る少年 ----------
const AX = 50;
{ const fl = box(12, 0.04, 10, mat('#8a6a4a')); fl.position.set(AX, 0.02, -2); qs.add(fl);
  const wl = box(12, 4.4, 0.2, mat('#d8c8a8')); wl.position.set(AX, 2.2, -5); qs.add(wl);
  const so = box(2.4, 0.6, 0.9, mat('#6a8a7a')); so.position.set(AX - 2.2, 0.3, -3.8); qs.add(so); const sb = box(2.4, 0.8, 0.2, mat('#6a8a7a')); sb.position.set(AX - 2.2, 0.8, -4.2); qs.add(sb);
  const dr = box(1.1, 2.3, 0.1, mat('#5a3a24')); dr.position.set(AX + 2.6, 1.15, -4.88); qs.add(dr);
  const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.4, 12), mat('#e8d8a0')); lp.position.set(AX - 3.6, 1.8, -4.3); qs.add(lp); }
const DAD2 = person(DAD, AX - 1.3, -3.0, 0.9); const MOM2 = person(MOM, AX - 0.2, -3.2, -0.9);
const TEEN2 = person(TEEN, AX + 0.8, -1.6, Math.PI); suitcase(TEEN2);
const tTeen = tag('主人公は、高校生の少年', { size: 52, w: 680, bg: '#14161c', sx: 1.7 }); tTeen.position.set(AX + 0.3, 2.6, -2.4); qs.add(tTeen);
const tRun = tag('両親の離婚で、家を飛び出す', { size: 48, w: 780, bg: '#e24050', sx: 1.8 }); tRun.position.set(AX + 0.3, 2.6, -2.4); qs.add(tRun);

// ---------- 3段目. 1960年代の空（x=100）。雲の上を飛ぶ旅客機。眼下に、点々と町の明かり ----------
const BX = 100;
const SKY3 = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), new THREE.MeshBasicMaterial({ fog: false, map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a6ab8'); gr.addColorStop(0.7, '#a8c8f0'); gr.addColorStop(1, '#f0d8b8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) }));
SKY3.position.set(BX, 6, -40); qs.add(SKY3);
const CLOUDS3 = []; for (let i = 0; i < 22; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(1.4 + R() * 1.8, 10, 8), mat('#f8f8fc')); c.scale.set(1.8, 0.6, 1.2); c.userData.x = BX - 24 + R() * 48; c.position.set(c.userData.x, -2 - R() * 2.5, -4 - R() * 22); qs.add(c); CLOUDS3.push(c); }
const PL3 = plane(BX, -10, -0.2, 0.8);
const tSixties = tag('1960年代の、華やかな時代', { size: 50, w: 740, bg: '#14161c', sx: 1.6 }); tSixties.position.set(BX, 4.6, 0); qs.add(tSixties);
const tHop = tag('町から町へ、飛び回る', { size: 54, w: 640, bg: '#e24050', sx: 1.5 }); tHop.position.set(BX, 4.6, 0); qs.add(tHop);

// ---------- 4段目. 銀行の窓口（x=150）。紙を差し出すパイロット。ドアの外に、帽子の男の影 ----------
const CX = 150;
{ const fl = box(14, 0.04, 10, mat('#a89a84')); fl.position.set(CX, 0.02, -2); qs.add(fl);
  const wl = box(14, 5, 0.2, mat('#d8ccb4')); wl.position.set(CX, 2.5, -5); qs.add(wl);
  const ct = box(5, 1.1, 0.8, mat('#6a4a30')); ct.position.set(CX - 0.6, 0.55, -3.0); qs.add(ct); const tp = box(5.2, 0.08, 1.0, mat('#3a2a1e')); tp.position.set(CX - 0.6, 1.12, -3.0); qs.add(tp);
  for (let i = 0; i < 4; i++) { const bar = box(0.05, 1.0, 0.05, mat('#c8a860')); bar.position.set(CX - 2.6 + i * 0.5, 1.65, -3.3); qs.add(bar); }
  for (let i = 0; i < 3; i++) { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 16), mat('#e8e0d0')); col.position.set(CX - 5 + i * 5, 2.5, -4.5); qs.add(col); } }
const TELL4 = person({ skin: '#f4d3b5', hair: '#3a2418', shirt: '#e8e8f0', pants: '#4a4a54', long: true, skirt: true }, CX - 0.6, -3.9, 0);
const P4 = person(PILOT, CX - 0.6, -2.1, Math.PI); pcap(P4);
const CHK4 = box(0.32, 0.01, 0.14, mat('#c8e0c8')); CHK4.position.set(CX - 0.6, 1.17, -2.7); qs.add(CHK4);
const BILLS4 = []; for (let i = 0; i < 6; i++) { const b = box(0.26, 0.012, 0.12, mat('#8ab08a')); b.position.set(CX - 0.4 + (i % 3) * 0.06, 1.17 + i * 0.014, -2.9); qs.add(b); BILLS4.push(b); }
const AG4 = person(AGENT, CX + 1.7, -2.0, -Math.PI / 2 - 0.4); hat(AG4);
const tCheck = tag('小切手をつくって、大金を手に', { size: 46, w: 820, bg: '#14161c', sx: 1.9 }); tCheck.position.set(CX + 0.4, 2.85, -2.2); qs.add(tCheck);
const tAgent = tag('追いかけるのは、ベテラン捜査官', { size: 46, w: 840, bg: '#e24050', sx: 1.9 }); tAgent.position.set(CX + 0.4, 2.85, -2.2); qs.add(tAgent);

// ---------- 5段目. 夜の映画館（x=200）。光るスクリーンと、並ぶ赤い座席 ----------
const TX = 200;
{ const fl = box(14, 0.04, 14, mat('#1a1012')); fl.position.set(TX, 0.02, -2); qs.add(fl);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 8; i++) { const s = box(0.6, 0.8, 0.6, mat('#7a1a22')); s.position.set(TX - 2.8 + i * 0.8, 0.4 + r * 0.25, 0.6 + r * 1.0); qs.add(s); } }
const SCRN5 = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.4), gl('#8aa8d8')); SCRN5.position.set(TX, 3.0, -5); qs.add(SCRN5);
const PLS5 = plane(TX, -4.9, 0, 0.32); PLS5.position.y = 2.4;
const t2002 = tag('2002年の、アメリカ映画', { size: 54, w: 700, bg: '#e6b450', color: '#14161c', sx: 2.3 }); t2002.position.set(TX, 2.6, -1.2); qs.add(t2002);
const tReal = tag('モデルは、実在の人物', { size: 54, w: 640, bg: '#e24050', sx: 2.1 }); tReal.position.set(TX, 2.6, -1.2); qs.add(tReal);

// ---------- 6段目. 回り舞台（x=250）。パイロット、医者…服が次々と変わる青年。うしろから帽子の捜査官が追う ----------
const DX = 250;
{ const fl = box(14, 0.04, 12, mat('#2a2e3a')); fl.position.set(DX, 0.02, -2); qs.add(fl);
  const wl = box(14, 6, 0.2, mat('#1e2230')); wl.position.set(DX, 3, -6); qs.add(wl);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.16, 32), mat('#c8a060')); st.position.set(DX, 0.08, -2.2); qs.add(st);
  const sp = new THREE.SpotLight('#fff4d8', 30, 12, 0.5, 0.5, 1); sp.position.set(DX, 6, 0); sp.target.position.set(DX, 0, -2.2); qs.add(sp); qs.add(sp.target); }
const LOOKS6 = [PILOT, DOC, { skin: '#f1c9a5', hair: '#3a2418', shirt: '#2a2a30', pants: '#2a2a30', tie: true }].map((o, i) => { const p = person(o, DX, -2.2, 0); p.position.y = 0.16; if (i === 0) pcap(p); return p; });
const STETH6 = box(0.3, 0.3, 0.02, mat('#3a3a3a')); STETH6.position.set(0, 1.25, 0.15); LOOKS6[1].add(STETH6);
const AG6 = person(AGENT, DX + 2.2, -3.0, -Math.PI / 2 + 0.3); hat(AG6);
const tAny = tag('パイロット、医者…何にでもなる', { size: 46, w: 840, bg: '#14161c', sx: 1.8 }); qs.add(tAny);
const tChase = tag('世界をまたにかけた、追いかけっこ', { size: 44, w: 860, bg: '#e6b450', color: '#14161c', sx: 1.8 }); qs.add(tChase);

// ---------- shots ----------
const ALL = [tPilot, tUni, tTeen, tRun, tSixties, tHop, tCheck, tAgent, t2002, tReal, tAny, tChase, Q1];
function base() { S.reset(); ALL.forEach(x => x.visible = false); if (S.floor) S.floor.visible = true; }

function shotLobby(t, quiz = 0) { // 1段目 0〜9：空港にあらわれた、若いパイロット。その制服、いったいどこで手に入れた？（0秒目がサムネ）
  base(); S.aim(0, -3); lift(0); S.hemi.intensity = 1.2;
  const w = quiz ? 2 : t;
  P1.position.z = -1.6 - w * 0.3; poseWalk(P1, w * 4.5, quiz ? 0 : 0.6);
  CREW1.forEach((c, i) => { c.position.z = [-0.6, -0.4][i] - w * 0.3; poseWalk(c, w * 4.5 + i, quiz ? 0 : 0.6); c.userData.head.rotation.y = (i ? -0.4 : 0.4); });
  CROWD1.forEach((p, i) => { poseWalk(p, t * 4 + i, 0.5); if (!quiz) p.userData.head.rotation.y = Math.sin(t + i) * 0.4; });
  const z = P1.position.z;
  P1.rotation.y = Math.PI;
  Q1.position.set(0.85, 1.8, z); Q1.userData.pop(1); if (!quiz && t > 4.3) Q1.visible = false;
  tPilot.position.set(0.2, 2.55, z + 0.3); tUni.position.copy(tPilot.position);
  if (!quiz) { tPilot.userData.pop((t - 1.6) / 0.35); if (t > 5.2) tPilot.visible = false; tUni.userData.pop((t - 5.5) / 0.35); }
  const u = ease(t / 9);
  look(lerp(0.7, 0.4, u), lerp(1.9, 1.8, u), z - lerp(3.4, 3.0, u), 0.2, 1.5, z + 0.5, 62);
  return qs;
}
function shotHome(t) { // 2段目 9〜17：主人公は、高校生の少年。両親の離婚をきっかけに、家を飛び出す
  base(); S.aim(AX, -3); lift(0); S.hemi.intensity = 1.0;
  DAD2.userData.arms[1].rotation.x = -0.8 + Math.sin(t * 4) * 0.5; MOM2.userData.arms[0].rotation.x = -0.6 + Math.sin(t * 4 + 1) * 0.4;
  const go = clamp((t - 4.3) / 3.5); TEEN2.position.set(AX + 0.8 + go * 1.8, 0, -1.6 - go * 3.0); TEEN2.rotation.y = go > 0 ? Math.PI - 0.55 : Math.PI * 0.0 + 0.2; poseWalk(TEEN2, t * 4, go > 0 && go < 1 ? 0.6 : 0);
  TEEN2.userData.head.rotation.x = go > 0 ? 0 : 0.3;
  tTeen.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tTeen.visible = false; tRun.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(AX + lerp(0.2, 0.6, u), lerp(2.0, 1.9, u), lerp(2.6, 2.0, u), AX + 0.3, 1.3, -3.0, 62);
  return qs;
}
function shotSky(t) { // 3段目 17〜25：舞台は、1960年代の華やかな時代。町から町へ、飛行機で飛び回る
  base(); S.aim(BX, -10); lift(0); S.hemi.intensity = 1.3; if (S.floor) S.floor.visible = false;
  PL3.position.x = BX - 2 + t * 0.6; PL3.position.y = Math.sin(t * 0.8) * 0.15;
  CLOUDS3.forEach((c, i) => { c.position.x = c.userData.x - t * 1.4; });
  tSixties.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSixties.visible = false; tHop.userData.pop((t - 4.3) / 0.35);
  tSixties.position.x = tHop.position.x = PL3.position.x + 2.0;
  look(PL3.position.x + 2.5, 4.2, 4.0, PL3.position.x + 0.5, 1.8, -10, 62);
  return qs;
}
function shotBank(t) { // 4段目 25〜33：小切手をつくって、次々と大金を手にする。追いかけるのは、ベテランの捜査官
  base(); S.aim(CX, -2); lift(0); S.hemi.intensity = 1.0;
  const k = clamp((t - 1.0) / 2.0); CHK4.position.z = -2.7 - k * 0.3; BILLS4.forEach((b, i) => { b.visible = t > 2.4; b.position.z = -2.9 + clamp((t - 2.6) / 1.2) * 0.3; });
  P4.userData.arms[1].rotation.x = t < 3.4 ? -1.2 : -0.3;
  AG4.visible = t > 4.0; AG4.position.x = CX + 1.7 - clamp((t - 4.0) / 3.5) * 0.5; poseWalk(AG4, t * 4, t > 4 && t < 7.5 ? 0.5 : 0);
  tCheck.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tCheck.visible = false; tAgent.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 8);
  look(CX + lerp(1.0, 1.4, u), lerp(2.1, 2.0, u), lerp(1.6, 1.4, u), CX + 0.4, 1.4, -2.6, 62);
  return qs;
}
function shotCinema(t) { // 5段目 33〜42：2002年の、アメリカ映画。モデルは、実在の人物
  base(); S.aim(TX, -2); lift(0); S.hemi.intensity = 0.35; S.darken(0.6, '#020202');
  PLS5.position.x = TX - 2.5 + ((t * 0.6) % 5);
  t2002.userData.pop((t - 0.4) / 0.35); if (t > 4.1) t2002.visible = false; tReal.userData.pop((t - 4.3) / 0.35);
  const u = ease(t / 9);
  look(TX + lerp(-0.4, 0.3, u), lerp(2.6, 2.5, u), lerp(4.2, 3.6, u), TX, 2.4, -3, 62);
  return qs;
}
function shotStage(t) { // 6段目 42〜49（決め手）：パイロット、医者…何にでもなりすます。世界をまたにかけた、追いかけっこ
  base(); S.aim(DX, -2); lift(0); S.hemi.intensity = 0.6; S.darken(0.4, '#050608');
  const idx = Math.min(2, Math.floor(t / 1.5)) % 3; LOOKS6.forEach((p, i) => { p.visible = i === idx; p.rotation.y = t * 0.9; });
  AG6.position.x = DX + 2.2 - clamp((t - 3.4) / 3.6) * 0.7; poseWalk(AG6, t * 4, t > 3.4 ? 0.5 : 0); AG6.visible = t > 3.2;
  tAny.position.set(DX, 3.0, -2.0); tChase.position.set(DX, 3.0, -2.0);
  if (t < 3.6) tAny.userData.pop((t - 0.3) / 0.35); else tChase.userData.pop((t - 3.7) / 0.3);
  const u = ease(t / 7);
  look(DX + lerp(0.6, 0.9, u), lerp(2.0, 2.0, u), lerp(2.8, 2.4, u), DX + 0.5, 1.5, -2.4, 62);
  return qs;
}
function shotQuiz(t) { // 49〜56：この映画、わかった？（空港のロビーに戻る）
  shotLobby(3.0, 1);
  ALL.forEach(x => x.visible = false); Q1.visible = true; Q1.userData.pop(1);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t) => shotLobby(t, 0) },
  { a: 9, b: 17, f: shotHome },
  { a: 17, b: 25, f: shotSky },
  { a: 25, b: 33, f: shotBank },
  { a: 33, b: 42, f: shotCinema },
  { a: 42, b: 49, f: shotStage },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.0, 5.6, '空港にあらわれた、<br>若いパイロット。'],
  [5.6, 9.0, 'その制服、いったい<br>どこで手に入れた？'],
  [9.2, 13.2, '主人公は、<br>高校生の少年。'],
  [13.2, 17.0, '両親の離婚をきっかけに、<br>家を飛び出す。'],
  [17.2, 21.0, '舞台は、1960年代の<br>華やかな時代。'],
  [21.0, 25.0, '町から町へ、<br>飛行機で飛び回る。'],
  [25.2, 29.0, '小切手をつくって、<br>次々と大金を手にする。'],
  [29.0, 33.0, '追いかけるのは、<br>ベテランの捜査官。'],
  [33.2, 37.4, '2002年の、<br>アメリカ映画。'],
  [37.4, 41.8, 'モデルは、<br>実在の人物。'],
  [42.2, 45.4, 'パイロット、医者…<br>何にでもなりすます。'],
  [45.4, 49.0, '世界をまたにかけた、<br>追いかけっこ。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、キャッチ・ミー・<br>イフ・ユー・キャン。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q134', v2: true, answer: 'キャッチ・ミー・イフ・ユー・キャン',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 13410,
    hits: [5.6, 13.2, 21.0, 29.0, 45.4, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 2.6, 5.6, 9.4, 13.2, 17.4, 21.4, 25.6, 29.2, 37.6, 42.4, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [27.4, 'bubble'], [33.0, 'whoosh'], [42.0, 'whoosh'], [43.6, 'poof', 0.4], [45.0, 'poof', 0.4], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '空港': 'くうこう', '若い': 'わかい', '制服': 'せいふく', '手に入れた': 'てにいれた', '主人公': 'しゅじんこう', '高校生': 'こうこうせい', '少年': 'しょうねん', '両親': 'りょうしん', '離婚': 'りこん', '家': 'いえ', '飛び出す': 'とびだす', '舞台': 'ぶたい', '1960年代': 'せんきゅうひゃくろくじゅうねんだい', '華やかな': 'はなやかな', '時代': 'じだい', '町': 'まち', '飛行機': 'ひこうき', '飛び回る': 'とびまわる', '小切手': 'こぎって', '次々': 'つぎつぎ', '大金': 'たいきん', '手にする': 'てにする', '追いかける': 'おいかける', '捜査官': 'そうさかん', '2002年': 'にせんにねん', '映画': 'えいが', '実在': 'じつざい', '人物': 'じんぶつ', '医者': 'いしゃ', '何にでも': 'なんにでも', '世界': 'せかい', '追いかけっこ': 'おいかけっこ', '間に': 'あいだに', '当てて': 'あてて', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'この映画のタイトル、わかる？\n空港にあらわれた、若いパイロット。その制服、いったいどこで手に入れた？主人公は、高校生の少年。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。\nわかったら、友だちにも出してみて👀',
    hashtags: ['タイトル当てクイズ', 'PrimeVideo', 'U-NEXT', '映画好き', '洋画'],
  },
});
applyQuizCards({ answer: 'キャッチ・ミー・<br>イフ・ユー・キャン', info: 'Prime Video・U-NEXT｜映画・141分', answerSize: 92 });
