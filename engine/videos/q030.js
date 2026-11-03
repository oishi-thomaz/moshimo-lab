import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, easeBack, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #030 アンナチュラル（ドラマ・日本・2018年・TBS・法医学ミステリー。U-NEXT・Prime Video・Disney+・Netflixで見放題、
//   justwatch.com/jp/テレビ番組/annachiyuraru で2026/11/3確認。Filmarks 4.4・レビュー109,084件 filmarks.com/dramas/906/2038）
// 確かめた事実：
//   ・野木亜紀子のオリジナル脚本。不自然死究明研究所（UDIラボ）で、日々運ばれてくる“不自然な遺体”の死因究明に奮闘する人々を描く。法医解剖医・ミコト、
//     同・解剖医の中堂、記録員の久部、臨床検査技師、所長（thetv.jp/program/0000931942/）
//   ・第1話：UDIラボは全国初の死因究明専門の研究所。態度の悪い先輩医師・中堂や気の合う同僚・東海林らと日々遺体を解剖し死因の解明に尽力。
//     ある日、突然死した35歳男性の親から調査の依頼が入る（thetv.jp/program/0000931942/1/）
//   ・2018年に放送。死因究明専門のスペシャリストが集まる研究所が舞台の法医学ミステリー。基本的に1話完結。ミコトの解剖実績は1,500件ぐらい（cinematoday.jp/news/N0144439）
// 構成（ヒント6段）：1 元気だった35歳の男性が突然死、親が調べてほしいと依頼 → 2 主人公は白衣の女性医師、診るのは亡くなった人
//   → 3 銀色の静かな部屋、毎日運ばれてくる不自然な死 → 4 口の悪い先輩医師と気の合う同僚、チームで死因を突きとめる
//   → 5 2018年の日本のドラマ、1話完結の法医学ミステリー → 6 決め手：日本初の死因究明専門の研究所、その名は不自然死究明研究所
// 遺体・傷・解剖の場面は見せない（白いシートの台と道具だけ）。各話の犯人・主人公の過去・中堂の目的には触れない。主題歌・俳優・ポスター・ロゴは使わない

const S = quizStage({ bg: '#18202c', floor: '#222a36', fogNear: 22, fogFar: 80 });
const qs = S.scene;
const R = rng(3030);

const HERO = { skin: '#f3d2b4', hair: '#2a1e1a', shirt: '#f4f6f8', pants: '#3a4050', long: true };
const SENPAI = { skin: '#e8c8a8', hair: '#1a1a1a', shirt: '#2a2a30', pants: '#1c1c22' };
const FRIEND = { skin: '#f1cfb0', hair: '#3a2a20', shirt: '#7aa8c8', pants: '#3a4050', long: true };
const BOYREC = { skin: '#efcfae', hair: '#2a2420', shirt: '#c8b890', pants: '#3a3a42' };
const PARENT = { skin: '#e8c8a8', hair: '#8a8a8a', shirt: '#6a5a4a', pants: '#3b3f4a' };
function coat(p) { const c = box(0.56, 0.9, 0.32, mat('#f8f8f6')); c.position.y = 1.0; p.add(c); return p; }

// ---------- 1段目. 居間（x=0）。突然死した35歳の男性。写真立てと、調べてほしいという手紙 ----------
{ const fl = box(12, 0.04, 9, mat('#7a6048')); fl.position.set(0, 0.02, 0); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#d8d0c0')); wl.position.set(0, 2.5, -2.6); qs.add(wl);
  const tbl = box(2.2, 0.7, 1.1, mat('#5a4030')); tbl.position.set(0, 0.35, 0); qs.add(tbl);
  const shelf = box(3, 1.2, 0.5, mat('#4a3426')); shelf.position.set(-2.8, 0.6, -2.2); qs.add(shelf);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshBasicMaterial({ color: '#4a5a7a' })); win.position.set(2.6, 2.6, -2.48); qs.add(win); }
const FRAME = new THREE.Group(); FRAME.position.set(-0.55, 0.72, -0.15); FRAME.rotation.x = -0.2; qs.add(FRAME);
{ const f = box(0.5, 0.62, 0.05, mat('#2a2a2e')); f.position.y = 0.31; FRAME.add(f);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), new THREE.MeshBasicMaterial({ map: canvasTex(128, 160, (g, w, h) => { g.fillStyle = '#9ab8d8'; g.fillRect(0, 0, w, h); g.fillStyle = '#efcfae'; g.fillRect(44, 40, 40, 44); g.fillStyle = '#2a2420'; g.fillRect(42, 32, 44, 14); g.fillStyle = '#4a6a8a'; g.fillRect(30, 90, 68, 70); }) })); pic.position.set(0, 0.31, 0.03); FRAME.add(pic);
  const rb = box(0.52, 0.06, 0.06, mat('#121212')); rb.position.set(0, 0.6, 0.03); FRAME.add(rb); }
const LETTER = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshBasicMaterial({ map: canvasTex(256, 340, (g, w, h) => { g.fillStyle = '#f8f6ee'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a2e'; g.textAlign = 'center'; g.font = '900 40px "Noto Sans CJK JP", sans-serif'; g.fillText('調査のお願い', w / 2, 60); g.fillStyle = 'rgba(40,40,40,.35)'; for (let y = 100; y < 320; y += 30) g.fillRect(28, y, w - 56 - ((y * 7) % 50), 10); }), side: THREE.DoubleSide })); qs.add(LETTER);
const parent = makePerson(PARENT); parent.position.set(1.05, 0, 0.6); parent.rotation.y = -1.0; qs.add(parent);
const t35 = tag('35歳 突然死', { size: 76, w: 460, bg: '#14161c', sx: 1.4 }); t35.position.set(-0.55, 1.55, -0.1); qs.add(t35);
const tWhy = tag('本当に病気？', { size: 74, w: 460, bg: '#e2483c', sx: 1.4 }); tWhy.position.set(0.6, 2.2, 0.4); qs.add(tWhy);

// ---------- 2段目. 白い廊下（x=30）。主人公は白衣の女性医師 ----------
const CX = 30;
{ const fl = box(4, 0.04, 20, mat('#c8ccd0')); fl.position.set(CX, 0.02, -6); qs.add(fl);
  for (const s of [-1, 1]) { const w = box(0.2, 4, 20, mat('#e8ecf0')); w.position.set(CX + s * 2, 2, -6); qs.add(w); }
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshBasicMaterial({ color: '#f8fbff' })); l.rotation.x = Math.PI / 2; l.position.set(CX, 3.95, 2 - i * 3.2); qs.add(l); }
  for (let i = 0; i < 4; i++) { const d = box(0.06, 2.2, 1.0, mat('#7a8a9a')); d.position.set(CX + (i % 2 ? 1.92 : -1.92), 1.1, -1 - i * 3.2); qs.add(d); } }
const hero2 = coat(makePerson(HERO)); hero2.position.set(CX, 0, -6); qs.add(hero2);
const tDoc = tag('白衣の女性医師', { size: 64, w: 520, bg: '#14161c', sx: 1.3 }); qs.add(tDoc);
const tDead = tag('診るのは亡くなった人', { size: 58, w: 640, bg: '#e2483c', sx: 1.7 }); qs.add(tDead);

// ---------- 3段目. 銀色の静かな部屋（x=60）。白いシートの台がならぶ ----------
const RX = 60;
{ const fl = box(14, 0.04, 10, mat('#8a9aa0')); fl.position.set(RX, 0.02, -1); qs.add(fl);
  const wl = box(14, 5, 0.2, mat('#b8c4c8')); wl.position.set(RX, 2.5, -4.2); qs.add(wl);
  for (let i = 0; i < 6; i++) { const tile = box(2.2, 0.02, 0.02, mat('#9aa8ac')); tile.position.set(RX - 5.5 + i * 2.2, 2.5, -4.08); qs.add(tile); }
  const sink = box(2.4, 1.0, 0.7, new THREE.MeshStandardMaterial({ color: '#c8d0d4', metalness: 0.7, roughness: 0.25 })); sink.position.set(RX + 4.2, 0.5, -3.6); qs.add(sink); }
const STEEL = new THREE.MeshStandardMaterial({ color: '#d0d6da', metalness: 0.75, roughness: 0.25 });
const SHEETM = mat('#f4f6f8');
const TABLES = [-3, 0, 3].map((dx, i) => { const g = new THREE.Group(); g.position.set(RX + dx, 0, -1.4); const top = box(0.9, 0.06, 2.1, STEEL); top.position.y = 0.92; g.add(top); const leg = box(0.2, 0.9, 0.2, STEEL); leg.position.y = 0.45; g.add(leg); const sh = box(0.92, 0.05, 2.0, SHEETM); sh.position.y = 0.97; sh.visible = i === 1; g.add(sh); g.userData.sheet = sh; qs.add(g); return g; });
const LAMPR = new THREE.Group(); LAMPR.position.set(RX, 3.2, -1.4); qs.add(LAMPR);
{ const d = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.3, 24), STEEL); LAMPR.add(d); const gl = new THREE.Mesh(new THREE.CircleGeometry(0.75, 24), new THREE.MeshBasicMaterial({ color: '#f8fbff' })); gl.rotation.x = Math.PI / 2; gl.position.y = -0.16; LAMPR.add(gl); const rod = box(0.06, 1.4, 0.06, STEEL); rod.position.y = 0.8; LAMPR.add(rod); }
const ROOMLIGHT = new THREE.SpotLight(0xf0f8ff, 0, 8, 0.7, 0.4, 1); ROOMLIGHT.position.set(RX, 3.0, -1.4); ROOMLIGHT.target.position.set(RX, 0.9, -1.4); qs.add(ROOMLIGHT); qs.add(ROOMLIGHT.target);
const TRAY = new THREE.Group(); TRAY.position.set(RX + 1.3, 0.95, -0.3); qs.add(TRAY);
{ const t = box(0.6, 0.04, 0.4, STEEL); TRAY.add(t); for (let i = 0; i < 3; i++) { const tl = box(0.03, 0.02, 0.26, STEEL); tl.position.set(-0.18 + i * 0.18, 0.03, 0); TRAY.add(tl); } const leg = box(0.05, 0.95, 0.05, STEEL); leg.position.y = -0.48; TRAY.add(leg); }
const tSilver = tag('静かな銀色の部屋', { size: 64, w: 560, bg: '#14161c', sx: 1.9 }); tSilver.position.set(RX, 2.3, -0.4); qs.add(tSilver);
const tOdd = tag('どこか不自然な死', { size: 64, w: 560, bg: '#e2483c', sx: 1.9 }); tOdd.position.set(RX, 2.3, -0.4); qs.add(tOdd);

// ---------- 4段目. 研究室の机（x=90）。口の悪い先輩、気の合う同僚、記録係 ----------
const TX = 90;
{ const fl = box(12, 0.04, 9, mat('#a8b0b4')); fl.position.set(TX, 0.02, 0); qs.add(fl);
  const wl = box(12, 5, 0.2, mat('#dfe4e6')); wl.position.set(TX, 2.5, -2.8); qs.add(wl);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({ map: canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#f4f6f4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a4a6a'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = 'rgba(40,60,100,.45)'; for (let y = 40; y < 230; y += 36) g.fillRect(30, y, w - 60 - ((y * 13) % 140), 10); g.fillStyle = '#c8261d'; g.beginPath(); g.arc(420, 70, 26, 0, Math.PI * 2); g.fill(); }) })); board.position.set(TX, 2.6, -2.68); qs.add(board);
  const desk = box(3.4, 0.8, 1.3, mat('#e8eaec')); desk.position.set(TX, 0.4, -0.4); qs.add(desk);
  const mic = new THREE.Group(); const mb = box(0.3, 0.06, 0.4, mat('#2a2a2e')); mic.add(mb); const ma = box(0.08, 0.5, 0.08, mat('#e8e8ec')); ma.position.set(0, 0.28, -0.1); mic.add(ma); const mt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.3, 12), mat('#2a2a2e')); mt.position.set(0, 0.5, 0.02); mt.rotation.x = 0.4; mic.add(mt); mic.position.set(TX - 1.0, 0.83, -0.5); qs.add(mic); }
const hero4 = coat(makePerson(HERO)); hero4.position.set(TX - 0.3, 0, 0.6); hero4.rotation.y = Math.PI; qs.add(hero4);
const senpai = coat(makePerson(SENPAI)); senpai.position.set(TX + 1.6, 0, 0.4); senpai.rotation.y = -1.6; qs.add(senpai);
const friend = makePerson(FRIEND); friend.position.set(TX - 1.7, 0, 0.3); friend.rotation.y = 1.4; qs.add(friend);
const recorder = makePerson(BOYREC); recorder.position.set(TX + 0.6, 0, -1.4); recorder.rotation.y = 0; qs.add(recorder);
const tSen = tag('口の悪い先輩医師', { size: 60, w: 560, bg: '#e2483c', sx: 2.0 }); tSen.position.set(TX + 1.2, 2.4, 0.6); qs.add(tSen);
const tFri = tag('気の合う同僚', { size: 60, w: 440, bg: '#e6b450', color: '#14161c', sx: 1.6 }); tFri.position.set(TX - 1.4, 2.4, 0.5); qs.add(tFri);
const tTeam = tag('チームで死因を突きとめる', { size: 56, w: 760, bg: '#14161c', sx: 2.4 }); tTeam.position.set(TX, 3.3, 0.2); qs.add(tTeam);

// ---------- 5段目. 事件ファイルの棚（x=120）。2018年の日本のドラマ、1話完結の法医学ミステリー ----------
const FX = 120;
{ const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ color: '#1e2838' })); bg.position.set(FX, 4, -3); qs.add(bg); }
const FILES = []; for (let i = 0; i < 10; i++) { const g = new THREE.Group(); const f = box(0.9, 1.2, 0.06, mat(['#4a6a9a', '#9a4a4a', '#4a8a6a', '#8a7a4a'][i % 4])); g.add(f);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshBasicMaterial({ map: canvasTex(128, 64, (gg, w, h) => { gg.fillStyle = '#f8f6ee'; gg.fillRect(0, 0, w, h); gg.fillStyle = '#2a2a2e'; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.font = '900 40px "Noto Sans CJK JP", sans-serif'; gg.fillText(`#${i + 1}`, w / 2, h / 2 + 2); }) })); lab.position.set(0, 0.25, 0.035); g.add(lab);
  g.position.set(FX - 2.7 + (i % 5) * 1.35, 1.0 + Math.floor(i / 5) * 1.5, -1.5); qs.add(g); FILES.push(g); }
const tJapan = tag('2018年 日本のドラマ', { size: 62, w: 660, bg: '#e6b450', color: '#14161c', sx: 3.4 }); tJapan.position.set(FX, 3.9, -1.2); qs.add(tJapan);
const tOne = tag('1話完結の法医学ミステリー', { size: 56, w: 780, bg: '#e2483c', sx: 3.6 }); tOne.position.set(FX, 3.9, -1.2); qs.add(tOne);

// ---------- 6段目. 研究所の入口（x=150）。日本初の死因究明専門の研究所 ----------
const BX = 150;
{ const gr = box(14, 0.04, 10, mat('#5a6068')); gr.position.set(BX, 0.02, 0); qs.add(gr);
  const bld = box(9, 5.5, 3, mat('#e4e8ea')); bld.position.set(BX, 2.75, -3.6); qs.add(bld);
  for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), new THREE.MeshBasicMaterial({ color: '#9ab8d0' })); w.position.set(BX - 3.2 + i * 1.6, 4.0, -2.09); qs.add(w); }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.2), new THREE.MeshBasicMaterial({ color: '#4a6a8a' })); door.position.set(BX, 1.1, -2.09); qs.add(door); }
const SIGNC = canvasTex(1024, 220, (g, w, h) => { g.fillStyle = '#20303c'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 104px "Noto Sans CJK JP", sans-serif'; g.fillText('不自然死究明研究所', w / 2, h / 2 + 6); });
const SIGN = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.0), new THREE.MeshBasicMaterial({ map: SIGNC })); SIGN.position.set(BX, 2.75, -2.06); qs.add(SIGN);
const hero6 = coat(makePerson(HERO)); hero6.position.set(BX - 0.4, 0, 0.6); hero6.rotation.y = 0.2; qs.add(hero6);
const tFirst = tag('日本初', { size: 90, w: 340, bg: '#e6b450', color: '#14161c', sx: 2.0 }); tFirst.position.set(BX - 1.5, 4.4, -1.8); qs.add(tFirst);
const tCause = tag('死因究明の専門ラボ', { size: 62, w: 620, bg: '#e2483c', sx: 3.0 }); tCause.position.set(BX + 1.2, 4.4, -1.8); qs.add(tCause);

// ---------- shots ----------
const ALL = [t35, tWhy, tDoc, tDead, tSilver, tOdd, tSen, tFri, tTeam, tJapan, tOne, tFirst, tCause];
function base() { S.reset(); ALL.forEach(x => x.visible = false); ROOMLIGHT.intensity = 0; }
function walk(p, ph, k = 1) { p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.3 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.3 * k; }

function shotHome(t, T) { // 1段目 0〜9：元気だった35歳の男性が、突然死。本当に、ただの病気なのか（0秒目がサムネ）
  base(); S.aim(0, 0); lift(-40);
  S.hemi.intensity = 0.8; S.key.intensity = 0.6; S.darken(0.5, '#0a0e18');
  t35.userData.pop(1);
  const k = ease((T - 3.6) / 1.0);
  LETTER.position.set(lerp(0.4, 0.62, k), lerp(0.73, 1.15, k), lerp(0.1, 0.88, k)); LETTER.rotation.set(lerp(-Math.PI / 2, 0, k), lerp(0, -0.7, k), 0);
  parent.userData.arms[0].rotation.x = -0.9 * k; parent.userData.arms[1].rotation.x = -0.9 * k; parent.userData.head.rotation.x = 0.3 + 0.2 * k;
  tWhy.userData.pop((T - 5.0) / 0.35); if (T > 5.0) t35.visible = false;
  const u = ease(T / 9);
  look(lerp(0.0, 0.2, u), lerp(2.4, 2.3, u), lerp(5.6, 5.0, u), lerp(0.1, 0.3, u), 1.0, -0.2, 52);
  return qs;
}
function shotDoctor(t) { // 2段目 9〜17：主人公は、白衣の女性医師。診るのは、亡くなった人たち
  base(); S.aim(CX, -2); lift(-40); S.hemi.intensity = 1.4;
  const k = clamp(t / 7); hero2.position.set(CX, 0, lerp(-6, -1.2, ease(k))); hero2.rotation.y = 0; walk(hero2, t * 6, k < 1 ? 1 : 0);
  tDoc.position.set(CX, 2.35, hero2.position.z); tDoc.userData.pop((t - 0.6) / 0.35); if (t > 3.9) tDoc.visible = false;
  tDead.position.set(CX, 2.35, hero2.position.z); tDead.userData.pop((t - 4.1) / 0.35);
  look(CX, 1.7, hero2.position.z + 4.2, CX, 1.4, hero2.position.z, 54);
  return qs;
}
function shotRoom(t) { // 3段目 17〜25：静かな銀色の部屋。運ばれてくるのは、どこか不自然な死
  base(); S.aim(RX, -1); lift(300); S.hemi.intensity = 1.3; S.key.intensity = 0.8; S.darken(0.2, '#0e1620');
  ROOMLIGHT.intensity = 40;
  TABLES.forEach((g, i) => { g.userData.sheet.visible = i === 1 || (i === 0 && t > 4.4) || (i === 2 && t > 5.0); });
  tSilver.userData.pop((t - 0.5) / 0.35); if (t > 4.0) tSilver.visible = false;
  tOdd.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(RX + lerp(-1.6, 0.4, u), lerp(2.4, 2.2, u), lerp(6.6, 5.8, u), RX, 1.6, -1.4, 56);
  return qs;
}
function shotTeam(t) { // 4段目 25〜33：口の悪い先輩医師に、気の合う同僚。チームで死因を突きとめる
  base(); S.aim(TX, 0); lift(-40); S.hemi.intensity = 1.35;
  senpai.userData.arms[0].rotation.x = t > 0.8 && t < 3.6 ? -0.6 + Math.sin(t * 6) * 0.25 : 0;
  hero4.rotation.y = Math.PI + lerp(0, 0.5, ease((t - 0.6) / 0.6)) - lerp(0, 1.0, ease((t - 2.2) / 0.6));
  tSen.userData.pop((t - 0.8) / 0.35); tFri.userData.pop((t - 2.2) / 0.35); if (t > 4.0) { tSen.visible = false; tFri.visible = false; }
  tTeam.userData.pop((t - 4.2) / 0.35);
  if (t > 4.2) { [hero4, senpai, friend, recorder].forEach(p => p.userData.head.rotation.x = 0.35 * ease((t - 4.2) / 0.6)); }
  const u = ease(t / 8);
  look(TX + lerp(-0.3, 0.3, u), lerp(2.4, 2.5, u), lerp(8.4, 7.8, u), TX, 1.5, -0.3, 54);
  return qs;
}
function shotFiles(t) { // 5段目 33〜42：2018年の日本のドラマ。1話完結の法医学ミステリー
  base(); S.aim(FX, 0); lift(220); S.hemi.intensity = 1.2;
  FILES.forEach((f, i) => { const k = easeBack(clamp((t - 0.3 - i * 0.12) / 0.4)); f.scale.setScalar(Math.max(0.01, k)); f.rotation.y = t > 5 + i * 0.1 ? Math.sin((t - 5 - i * 0.1) * 3) * 0.15 : 0; });
  tJapan.userData.pop((t - 1.0) / 0.35); if (t > 4.0) tJapan.visible = false;
  tOne.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 9);
  look(FX, 2.6, lerp(9.0, 8.4, u), FX, 2.6, -1.5, 56);
  return qs;
}
function shotLab(t) { // 6段目 42〜49（決め手）：日本初の死因究明専門の研究所。その名は、不自然死究明研究所
  base(); S.aim(BX, -2); lift(-20); S.hemi.intensity = 1.3;
  tFirst.userData.pop((t - 0.4) / 0.35); tCause.userData.pop((t - 1.2) / 0.35);
  if (t > 3.2) { tFirst.visible = false; tCause.visible = false; }
  hero6.rotation.y = lerp(0.2, Math.PI, ease((t - 3.2) / 0.8));
  const k = ease((t - 3.2) / 1.2);
  look(BX + lerp(0.6, 0, k), lerp(2.2, 2.6, k), lerp(7.4, 7.0, k), BX, lerp(2.4, 2.75, k), -2.0, lerp(58, 54, k));
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（銀色の部屋。白衣の医師にだけ赤い光）
  base(); S.aim(RX, -1); lift(-30);
  TABLES.forEach(g => g.userData.sheet.visible = true);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.0, 0.15, d); S.key.intensity = lerp(0.6, 0, d); S.darken(lerp(0.3, 1, d), '#05060a');
  hero2.position.set(RX + 1.0, 0, 0.6); hero2.rotation.y = -0.5; walk(hero2, 0, 0);
  S.spot.position.set(RX + 1.0, 5, 2.0); S.spot.target.position.set(RX + 1.0, 1.0, 0.6); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  const k = ease(t / 7);
  look(RX + lerp(0.2, 0.8, k), lerp(2.4, 2.0, k), lerp(5.6, 4.6, k), RX + 0.6, 1.3, -0.4, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotHome },
  { a: 9, b: 17, f: shotDoctor },
  { a: 17, b: 25, f: shotRoom },
  { a: 25, b: 33, f: shotTeam },
  { a: 33, b: 42, f: shotFiles },
  { a: 42, b: 49, f: shotLab },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '元気だった35歳の男性が、<br>突然死んだ。'],
  [5.6, 9.0, '本当に、<br>ただの病気なのか。'],
  [9.2, 13.2, '主人公は、<br>白衣の女性医師。'],
  [13.2, 17.0, '診るのは、<br>亡くなった人たち。'],
  [17.2, 21.0, '静かな、<br>銀色の部屋。'],
  [21.0, 25.0, '毎日運ばれてくるのは、<br>どこか不自然な死。'],
  [25.2, 29.0, '口の悪い先輩医師に、<br>気の合う同僚。'],
  [29.0, 33.0, 'チームで、<br>本当の死因を突きとめる。'],
  [33.2, 37.4, '2018年の、<br>日本のドラマ。'],
  [37.4, 41.8, '1話完結の、<br>法医学ミステリー。'],
  [42.2, 45.4, '日本初の、<br>死因究明の専門ラボ。'],
  [45.4, 49.0, 'その名は、<br>不自然死究明研究所。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、アンナチュラル。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q030', v2: true, answer: 'アンナチュラル',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'mystery', seed: 3030,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [5.0, 13.2, 21.2, 25.8, 29.2, 37.6, 42.6, 45.6, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [45.4, 'poof'], [49.0, 'whoosh'], [49.4, 'meter', 0.5]],
    narr: { '不自然死究明研究所': 'ふしぜんしきゅうめいけんきゅうじょ', '日本初': 'にほんはつ', '元気': 'げんき', '35歳': 'さんじゅうごさい', '男性': 'だんせい', '突然': 'とつぜん', '死んだ': 'しんだ', '本当': 'ほんとう', '病気': 'びょうき', '主人公': 'しゅじんこう', '白衣': 'はくい', '女性': 'じょせい', '医師': 'いし', '診る': 'みる', '亡くなった': 'なくなった', '人たち': 'ひとたち', '静か': 'しずか', '銀色': 'ぎんいろ', '部屋': 'へや', '毎日': 'まいにち', '運ばれて': 'はこばれて', '不自然': 'ふしぜん', '口': 'くち', '悪い': 'わるい', '先輩': 'せんぱい', '気の合う': 'きのあう', '同僚': 'どうりょう', '死因': 'しいん', '突きとめる': 'つきとめる', '2018年': 'にせんじゅうはちねん', '日本': 'にほん', '1話完結': 'いちわかんけつ', '法医学': 'ほういがく', '究明': 'きゅうめい', '専門': 'せんもん', '何秒': 'なんびょう', '感想': 'かんそう', '聞かせて': 'きかせて' },
    caption: 'このドラマのタイトル、わかる？\n元気だった35歳の男性が、突然死んだ。本当に、ただの病気なのか。主人公は白衣の女性医師。診るのは、亡くなった人たち。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'U-NEXT', 'PrimeVideo', 'ドラマ好き', 'ミステリー'],
  },
});
applyQuizCards({ answer: 'アンナチュラル', info: 'U-NEXT・Prime Video｜日本のドラマ', answerSize: 120 });
