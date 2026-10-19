import * as THREE from 'three';
import { rng, clamp, lerp, ease, easeOut, easeBack, fade, mat, box, comma, makeQ } from '../lib.js';
import { stage, makeBar, makeCrowd, makeLabel, setStageColor } from '../scenes/stage.js';
import { lift, look, runStory, endCard, countUp, textSprite, setTop, setHud, el } from '../story.js';

// もしも国の使途不明金を全部足したら？
// 「使途不明金」は政府の正式な用語ではない。ここでは「国民が使い道を確かめられない国のお金」として、出典のある数字だけを足す。
// ① 内閣官房報償費（機密費）：領収書不要・使途非公開。2012年12月〜2024年5月の支出 約139億円（情報公開請求で開示された出納管理簿をしんぶん赤旗が集計、2024年7月13日）
// ② コロナ予備費：国会に使い道が報告された約12兆円のうち、最終的な使い道まで追えたのは6.5%、約11兆円は追えず（日本経済新聞の独自集計 2022年4月23日、Business Journal 2022年5月の紹介記事）
// ③ 会計検査院が指摘した不当事項のうち是正（返還など）がまだのもの：昭和21年度〜令和3年度分 346件 153億1,996万円（令和4年度決算検査報告、2023年7月末現在）
// 合計 約11兆292億円（①＋②＋③、②は概数）→ 表示は約11兆300億円
// 人口 1億2,265万人（総務省 人口推計 2026年9月1日概算）→ 1人あたり 約8万9,900円 ≒ 約9万円
// 租税総額（国税＋地方税）127兆3,350億円（2024年度、総務省 地方財政白書 令和8年版）÷ 人口 → 1人あたり 約104万円/年
// 合計 ÷ 104万円 ≒ 約1,060万年分

// ---------- 札束 ----------
const billM = [mat('#9fb59a'), mat('#c9b48a'), mat('#8fa98c')];
const bandM = mat('#f4f1e8');
const billGeo = new THREE.BoxGeometry(1.5, 0.16, 0.7), bandGeo = new THREE.BoxGeometry(0.18, 0.165, 0.71);
function makeStack(x, z, n, seed) {
  const g = new THREE.Group(); g.position.set(x, 0.3, z); stage.add(g);
  const r = rng(seed); const items = [];
  for (let i = 0; i < n; i++) {
    const b = new THREE.Mesh(billGeo, billM[i % 3]); const k = new THREE.Mesh(bandGeo, bandM);
    const px = (r() - .5) * 0.06, pz = (r() - .5) * 0.06, ry = (r() - .5) * 0.12;
    b.position.set(px, 0.08 + i * 0.165, pz); b.rotation.y = ry; k.position.copy(b.position); k.rotation.y = ry; b.castShadow = true;
    g.add(b); g.add(k); items.push(b, k);
  }
  return { g, set(h) { items.forEach((m, j) => m.visible = Math.floor(j / 2) < h); } };
}
// 大きな山（9つの束を3×3）
const pile = []; { let s = 1; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) pile.push(makeStack(i * 1.7, j * 0.85, 22, s++)); }
function pileH(k) { pile.forEach((p, i) => { p.g.visible = true; p.set(Math.round(22 * clamp(k * 1.3 - i * 0.04))); }); }
const pileQ = makeQ(); pileQ.scale.setScalar(1.6); stage.add(pileQ);
// ① 機密費：金庫
const safe = new THREE.Group(); safe.position.set(0, 0.3, 0); stage.add(safe);
{ const body = box(2.4, 2.6, 2.0, mat('#2a2f3a')); body.position.y = 1.3; safe.add(body); const door = box(2.0, 2.2, 0.08, mat('#3b4250')); door.position.set(0, 1.3, 1.02); safe.add(door);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 24), mat('#c7ccd2')); dial.rotation.x = Math.PI / 2; dial.position.set(0.4, 1.4, 1.1); safe.add(dial);
  const handle = box(0.12, 0.6, 0.12, mat('#c7ccd2')); handle.position.set(-0.5, 1.3, 1.12); safe.add(handle); }
const safeLab = textSprite('機密費', { w: 512, h: 160, size: 96, bg: 'rgba(20,24,32,.9)', color: '#f2c14e', sx: 2.2 }); safeLab.position.set(0, 3.5, 0.6); safe.add(safeLab);
const receipt = textSprite('領収書　なし', { w: 640, h: 140, size: 76, bg: '#ffffff', color: '#c0262d', sx: 2.6 }); receipt.position.set(0, 2.9, 1.6); safe.add(receipt);
// ② 予備費：2本の棒
const barOk = makeBar({ color: '#7ff0c8', label: '追えた', x: -1.8, z: 0, w: 1.8, d: 1.8 });
const barNg = makeBar({ color: '#ff6b6b', label: '追えない', x: 1.8, z: 0, w: 1.8, d: 1.8 });
// ③ 不当事項：書類の山と「不当」のはんこ
const docs = new THREE.Group(); docs.position.set(0, 0.3, 0); stage.add(docs);
{ const r = rng(5); for (let i = 0; i < 18; i++) { const d = box(1.4, 0.05, 1.0, mat('#f2f2ee')); d.position.set((r() - .5) * 0.1, 0.03 + i * 0.055, (r() - .5) * 0.1); d.rotation.y = (r() - .5) * 0.3; docs.add(d); } }
const stamp = textSprite('不当', { w: 256, h: 256, size: 150, color: '#e0303a', sx: 1.3 }); stamp.position.set(0.1, 1.6, 0.3); docs.add(stamp);
// 人々
const crowd = makeCrowd(70, 9, { w: 14, d: 5, x: 0, z: 5.0 }); crowd.people.forEach(p => { p.rotation.y = Math.PI + p.rotation.y; });
const crowdQ = crowd.people.slice(0, 8).map(p => { const q = makeQ(); stage.add(q); return { q, p }; });

function hideAll() {
  pile.forEach(p => p.g.visible = false); pileQ.visible = false; safe.visible = false; docs.visible = false;
  [barOk, barNg].forEach(b => b.g.visible = false); crowd.g.visible = false; crowdQ.forEach(({ q }) => q.visible = false);
  setStageColor('#14213a');
}
function qs(t, on) { crowdQ.forEach(({ q, p }, i) => { q.visible = on; q.position.set(p.position.x, 2.7 + Math.sin(t * 3 + i) * 0.05, p.position.z + 5.0 - 5.0); q.position.copy(p.getWorldPosition(new THREE.Vector3())).add(new THREE.Vector3(0, 2.45 + Math.sin(t * 3 + i) * 0.05, 0)); q.scale.setScalar(0.55); }); }
const yen = (v) => { const cho = Math.floor(v / 10000), oku = Math.round(v % 10000); return cho ? `${cho}兆${oku ? comma(oku) + '億' : ''}円` : `${comma(oku)}億円`; };

const SUBS = [
  [2.6, 6.0, '私たちの税金、行き先は<br>全部わかってる？'],
  [6.2, 10.1, 'その1。内閣官房の機密費。<br>領収書はいらない。'],
  [10.1, 14, '何に使ったかは、<br>公開されない。'],
  [14.2, 18.1, 'その2。コロナ予備費、<br>約12兆円。'],
  [18.1, 22, '使い道まで追えたのは、<br>たった6.5%。'],
  [22.2, 26.1, 'その3。会計検査院が<br>不当と指摘したお金。'],
  [26.1, 30, 'まだ返ってきていないのが、<br>約153億円。'],
  [30.2, 34.6, 'この3つを、<br>全部足すと…'],
  [34.6, 39, '約11兆300億円。'],
  [39.2, 43.6, '国民全員で割ると、<br>1人約9万円。'],
  [43.6, 47.8, '1人が1年に払う税金は、<br>約104万円。'],
  [48.1, 52.6, '結果：1人が払う税金の<br>約1,060万年分だった。'],
  [52.6, 55.4, 'そのほとんどは、<br>コロナ予備費の分。'],
  [55.6, 59.4, 'このお金、何に<br>使ってほしかった？'],
];
const IMP = [19.0, 34.7, 39.4, 48.2]; // 強調の効果音（META.impacts と同じ）

function pileCam(t, d, far = 0) { const u = ease(t / d); look(lerp(5.0, 3.6, u), lerp(4.6 + far, 4.0 + far, u), lerp(13.5 + far * 2, 12.0 + far * 2, u), 0, 2.4, 0, 50); }
function shot0(t, T) { // hook：札束の山がせり上がり、？が出る。数字が一気に増える
  lift(0); hideAll(); setStageColor('#0f1626');
  pileH(easeOut(clamp(t / 2.0))); pileQ.visible = t > 1.0; pileQ.position.set(0, 4.9, 0); pileQ.scale.setScalar(1.6 * easeBack(clamp((t - 1.0) / 0.3)));
  pileCam(t, 2.5);
  el.title.style.opacity = 1;
  setHud('使い道が分からないお金', yen(Math.round(110300 * easeOut(clamp(t / 2.2)))), 1, { color: '#ff8a7a' });
  return stage;
}
function shot1(t, T) { // 人々が見上げる
  lift(160); hideAll(); setStageColor('#0f1626'); pileH(1); pileQ.visible = true; pileQ.position.set(0, 4.9, 0);
  crowd.g.visible = true; crowd.people.forEach(p => p.userData.head.rotation.x = -0.35); qs(t, t > 0.8);
  el.title.style.opacity = clamp(1 - t / 0.4);
  const u = ease(t / 3.5);
  look(lerp(0, 1.5, u), lerp(3.4, 3.8, u), lerp(13, 12, u), 0, 2.6, 0, 50);
  return stage;
}
function shot2(t, T) { // ① 機密費
  lift(170); hideAll(); safe.visible = true; receipt.visible = t > 2.4; receipt.scale.set(2.6 * easeBack(clamp((t - 2.4) / 0.3)), 2.6 * 140 / 640 * easeBack(clamp((t - 2.4) / 0.3)), 1);
  safe.rotation.y = Math.sin(t * 0.3) * 0.15;
  const u = ease(t / 8);
  look(lerp(2.8, 1.6, u), lerp(2.8, 2.6, u), lerp(9.5, 8.5, u), 0, 2.3, 0, 50);
  setHud('その1', '機密費', 1);
  setTop('機密費の支出（2012年12月〜2024年5月）', '約' + countUp(t, 139, 4.0, 1.2) + '億円', fade(t, 3.95, 8, 0.25));
  return stage;
}
function shot3(t, T) { // ② コロナ予備費：6.5% と 93.5%
  lift(270); hideAll();
  const k = easeOut(clamp((t - 0.3) / 1.4));
  barOk.g.visible = barNg.g.visible = true;
  const ok = t > 3.6 ? easeOut(clamp((t - 3.6) / 0.8)) : 1;
  barOk.setH(Math.max(0.01, 7.0 * k * lerp(1, 0.065, ok)), t > 3.6 ? '6.5%' : '');
  barNg.setH(Math.max(0.01, 7.0 * k * (t > 3.6 ? lerp(0, 0.935, ok) : 0)), t > 3.6 ? '93.5%' : '');
  const u = ease(t / 8);
  look(lerp(0.5, 0, u), lerp(5.2, 4.8, u), lerp(19, 18, u), 0, 4.2, 0, 50);
  setHud('その2', 'コロナ予備費', 1);
  setTop('使い道まで追えなかったお金（日経の集計・2022年）', '約' + countUp(t, 11, 4.6, 0.6) + '兆円', fade(t, 4.55, 8, 0.25), '#ff8a7a');
  return stage;
}
function shot4(t, T) { // ③ 不当事項
  lift(60); hideAll(); docs.visible = true;
  const s = easeBack(clamp((t - 0.8) / 0.25)); stamp.visible = t > 0.8; stamp.scale.set(1.3 * (2 - s), 1.3 * (2 - s), 1); stamp.material.opacity = clamp((t - 0.8) / 0.15);
  const u = ease(t / 8);
  look(lerp(1.8, 1.0, u), lerp(3.2, 2.9, u), lerp(6.6, 6.0, u), 0, 1.2, 0, 50);
  setHud('その3', '不当事項', 1);
  setTop('まだ是正されていない不当事項（1947〜2021年度分）', '約' + countUp(t, 153, 4.0, 1.2) + '億円', fade(t, 3.95, 8, 0.25));
  return stage;
}
function shot5(t, T) { // 合計：山が積み上がる
  lift(140); hideAll(); setStageColor('#0f1626');
  pileH(clamp(t / 4.4)); pileQ.visible = t > 4.4; pileQ.position.set(0, 4.9, 0); pileQ.scale.setScalar(1.6 * easeBack(clamp((t - 4.4) / 0.3)));
  el.flash.style.opacity = t >= 4.5 ? 0.35 * Math.max(0, 1 - (t - 4.5) / 0.3) : 0;
  pileCam(t, 9.2, 1.2);
  setHud('合計', '①＋②＋③', 1);
  setTop('使い道が分からないお金の合計（推計）', yen(Math.round(110300 * easeOut(clamp((t - 4.45) / 0.7)))), fade(t, 4.4, 9.2, 0.15), '#ff8a7a');
  return stage;
}
function shot6(t, T) { // 1人あたり
  lift(160); hideAll(); crowd.g.visible = true; crowd.people.forEach(p => p.userData.head.rotation.x = 0); qs(t, true);
  const u = ease(t / 8.8);
  look(lerp(-3, 3, u), lerp(4.5, 4.0, u), lerp(14, 12.5, u), 0, 1.6, 4.5, 50);
  setHud('日本の人口', '1億2,265万人', 1);
  if (t < 4.4) setTop('国民全員で割ると（2026年9月）', '約' + countUp(t, 9, 0.2, 0.5) + '万円', fade(t, 0.15, 4.4, 0.2), '#ff8a7a');
  else setTop('1人あたりの税金（国＋地方・2024年度・推計）', '約' + countUp(t - 4.4, 104, 0.1, 1.0) + '万円/年', fade(t, 4.4, 8.8, 0.2));
  return stage;
}
function shot7(t, T) { // 結果
  lift(140); hideAll(); setStageColor('#0f1626'); pileH(1); pileQ.visible = true; pileQ.position.set(0, 4.9, 0);
  crowd.g.visible = true; crowd.people.forEach(p => p.userData.head.rotation.x = -0.35); qs(t, true);
  const u = ease(t / 7.5);
  look(lerp(1.5, -1.5, u), lerp(4.2, 5.2, u), lerp(14, 16, u), 0, 2.4, 0, 50);
  setTop('1人が払う税金にすると（推計）', '約' + comma(countUp(t, 1060, 0.1, 0.6)) + '万年分', fade(t, 0.05, 7.5, 0.15), '#ff8a7a');
  return stage;
}
function shot8(t, T) { // ループ：冒頭の山
  lift(0); hideAll(); setStageColor('#0f1626'); pileH(1); pileQ.visible = true; pileQ.position.set(0, 4.9, 0);
  pileCam(t + 1, 5);
  setHud('使い道が分からないお金', '約11兆300億円', 1, { color: '#ff8a7a' });
  return stage;
}

const shots = [
  { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
  { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
  { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
];
runStory({
  shots, subs: SUBS, duration: 64.5,
  meta: {
    id: '0033',
    title: '国の使途不明金を全部足したら？',
    titleHtml: '国の使途不明金を<br>全部足したら？',
    mood: 'tension', seed: 33, hits: [6.2, 14.2, 22.2], risers: [34.7, 48.2], impacts: IMP,
    ask: 'このお金、何に使ってほしかった？',
    narr: { '1,060万年分': '1060万年分', '6.5%': '6.5パーセント' },
    caption: 'もしも国の「使途不明金」を全部足したら？\n使途不明金は正式な用語ではないので、国民が使い道を確かめられない国のお金を、出典のある数字だけで足してみた。\n\n① 内閣官房の機密費：領収書不要・使途非公開。2012年12月〜2024年5月で約139億円\n② コロナ予備費：約12兆円のうち、使い道まで追えたのは6.5%。追えなかったのは約11兆円（日経の独自集計）\n③ 会計検査院が不当と指摘し、まだ是正されていないお金：1947〜2021年度分で約153億円\n\n合計 約11兆300億円（推計）。国民全員で割ると1人約9万円。1人が1年に払う税金（約104万円）の約1,060万年分。\n※だれかが不正に使ったという意味ではありません。使い道を国民が確かめられないお金の合計です。\n\nこのお金、何に使ってほしかった？ コメントで教えて。\n\n出典：しんぶん赤旗（2024年7月13日・情報公開資料の集計）、日本経済新聞（2022年4月23日）、会計検査院 令和4年度決算検査報告、総務省 人口推計（2026年9月）・地方財政白書（令和8年版）',
    hashtags: ['もしもラボ', '税金', '使途不明金', '会計検査院', '雑学'],
    endStats: [['機密費（2012年12月〜2024年5月）', '約139億円', ''], ['コロナ予備費で使い道を追えなかった分', '約11兆円', '日経集計'], ['是正されていない不当事項', '約153億円', '1947〜2021年度'], ['合計（推計）', '約11兆300億円', ''], ['国民1人あたり', '約9万円', '2026年9月'], ['1人の税金にすると', '約1,060万年分', '推計']],
    sources: '出典：しんぶん赤旗（情報公開資料の集計）、日本経済新聞、<br>会計検査院、総務省（人口推計・地方財政白書）',
  },
});
