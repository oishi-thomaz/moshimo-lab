import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, windowTextures, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #001（映画・ドラマ紹介アカウントの試作）
// お題：地面師たち（Netflix・全7話）。作品の映像・キャラクター・ロゴは使わず、設定だけを汎用の3Dで見せる
// もしもラボのエンジンを流用。ロゴとまとめカードはこのファイルの中で差し替える（エンジン本体は触らない）
// 確かめた事実（2026/11/2）：
//   ・2024年7月25日に全7話を一挙配信。原作は新庄耕の小説、実在の地面師事件に着想。舞台は地価が再び上がりはじめた東京。
//     不動産の売買をエサに巨額の金をだまし取る。狙うのは100億円の不動産。標的は売主・地主と大手の開発業者で、警察も迫る（about.netflix.com/ja/news/japanese-crime-suspense-series-tokyo-swindlers-premieres-july-25）
//   ・グループの役割：リーダー（首謀者）、交渉役（主人公）、情報屋、法律屋、手配師（偽の地主＝なりすまし役を探す）、ニンベン師（パスポートや運転免許証など偽造書類を用意）（crank-in.net/news/150085/1）
//   ・主人公はつらい過去を抱えている（filmarks.com/dramas/14823/20162/episodes/275081 第3話のあらすじ。Filmarks 4.1）
// 構成：ヒント6段（契約の日にハンコで大金が動く → つらい過去の男と裏の仕事 → 地価の上がる大都会 → リーダーと6人のプロ・100億円 → 東京・不動産詐欺・大手の開発会社 → 決め手：本物の地主になりすまして他人の土地を売る、書類も全部ニセモノ）
// 作品名・人物名・地名・会社名は6段目まで映像にも出さない（5段目の東京だけ）。結末・どんでん返しの中身には触れない。人が傷つく描写は出さない

const S = quizStage({ bg: '#1a2130', floor: '#20283a', fogNear: 22, fogFar: 70 });
const qs = S.scene;
const R = rng(101);

const SUIT = { skin: '#efcfae', hair: '#1d1a19', shirt: '#2b3040', pants: '#22262f', tie: true };
const OWNER = { skin: '#ecc9a6', hair: '#a8a8a8', shirt: '#7a6650', pants: '#3b3f4a' };
const HERO = { skin: '#efcfae', hair: '#1d1a19', shirt: '#34405a', pants: '#1f2430' };
const goldM = new THREE.MeshStandardMaterial({ color: '#e0ad3e', metalness: 0.6, roughness: 0.3, emissive: '#3a2a08' });
const barGeo = new THREE.BoxGeometry(0.8, 0.22, 0.36);
const wood = mat('#4a3426');

// ハンコ（共通）
function makeHanko() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.64, 24), mat('#dcb98c')); b.position.y = 0.32; b.castShadow = true; g.add(b); const r = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.05, 24), mat('#c0221a')); r.position.y = 0.025; g.add(r); return g; }
function sealTex(ch) { return canvasTex(256, 256, (g) => { g.strokeStyle = '#d0261d'; g.lineWidth = 18; g.beginPath(); g.arc(128, 128, 106, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#d0261d'; g.font = '900 150px "Noto Sans CJK JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 128, 136); }); }
// ハンコを書類の上に順に押す（xs：押す位置、ts：押す時刻、y：机の高さ）
function stampAt(hanko, seals, xs, ts, y, z, t) {
  let hx = xs[0] - 0.8, hy = y + 0.25;
  ts.forEach((st, i) => {
    const d = t - st, prev = i ? xs[i - 1] : xs[0] - 0.8;
    if (d > -0.5 && d < 0.7) { hx = lerp(prev, xs[i], ease((d + 0.5) / 0.4)); hy = d < 0 ? y + 0.25 : d < 0.12 ? lerp(y + 0.25, y + 0.005, d / 0.12) : d < 0.3 ? y + 0.005 : lerp(y + 0.005, y + 0.25, ease((d - 0.3) / 0.3)); }
    else if (d >= 0.7) { hx = xs[i]; hy = y + 0.25; }
    seals[i].material.opacity = d >= 0.12 ? 1 : 0;
  });
  hanko.position.set(hx, hy, z);
}

// ---------- 1段目. 契約の日（x=0）。机の上に札束が積まれ、ハンコが押される ----------
const ROOM = new THREE.Group(); qs.add(ROOM);
{ const carpet = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), mat('#5a4a44')); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.02, 0); carpet.receiveShadow = true; ROOM.add(carpet);
  const wall = box(12, 5, 0.2, mat('#d8d2c4')); wall.position.set(0, 2.5, -2.6); ROOM.add(wall);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.0), new THREE.MeshBasicMaterial({ color: '#a8c4dc' })); win.position.set(0, 2.6, -2.48); ROOM.add(win);
  for (const x of [-2.1, 0, 2.1]) { const f = box(0.08, 2.1, 0.06, mat('#6a5a4a')); f.position.set(x, 2.6, -2.45); ROOM.add(f); }
  const desk = box(3.4, 0.9, 1.7, wood); desk.position.set(0, 0.45, 0); ROOM.add(desk); }
const contractTex = canvasTex(512, 690, (g, w, h) => { g.fillStyle = '#f6f3ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b2b2b'; g.textAlign = 'center'; g.font = '900 84px "Noto Sans CJK JP", sans-serif'; g.fillText('契約書', w / 2, 120); g.fillStyle = 'rgba(40,40,40,.3)'; for (let y = 200; y < 560; y += 44) g.fillRect(64, y, w - 128 - ((y * 7) % 96), 14); g.strokeStyle = '#2b2b2b'; g.lineWidth = 4; g.strokeRect(300, 580, 150, 80); });
const contract = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.21), new THREE.MeshLambertMaterial({ map: contractTex })); contract.rotation.x = -Math.PI / 2; contract.rotation.z = 0.08; contract.position.set(0.55, 0.905, 0.15); contract.receiveShadow = true; qs.add(contract);
const seal1 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: sealTex('印'), transparent: true, opacity: 0, depthWrite: false })); seal1.rotation.x = -Math.PI / 2; seal1.position.set(0.78, 0.912, 0.55); qs.add(seal1);
const hanko1 = makeHanko(); qs.add(hanko1);
// 札束（帯つき。文字なし）
const billM = mat('#d8cfb0'), bandM = mat('#f4f1ea');
const BUNDLES = [];
for (let s = 0; s < 6; s++) for (let L = 0; L < 7; L++) {
  const g = new THREE.Group(); const b = box(0.36, 0.07, 0.17, billM); g.add(b); const bd = box(0.07, 0.074, 0.175, bandM); g.add(bd);
  const hx = -1.15 + (s % 3) * 0.42, hz = -0.05 + Math.floor(s / 3) * 0.3;
  g.userData.home = new THREE.Vector3(hx, 0.94 + L * 0.072, hz); g.userData.d = -0.35 + L * 0.11 + s * 0.035; g.rotation.y = (R() - 0.5) * 0.12; qs.add(g); BUNDLES.push(g);
}
const buyer1 = makePerson(SUIT); buyer1.position.set(1.65, 0, 1.25); buyer1.rotation.y = Math.PI + 0.55; qs.add(buyer1);
const buyer2 = makePerson({ ...SUIT, shirt: '#3d4558', hair: '#2c2421' }); buyer2.position.set(-1.75, 0, 1.15); buyer2.rotation.y = Math.PI - 0.6; qs.add(buyer2);
const seller = makePerson(OWNER); seller.position.set(-0.25, 0, -1.25); qs.add(seller);

// ---------- 2段目. 夜の路地（x=22）。つらい過去を抱えた男と、近づく男 ----------
{ const g = new THREE.Group(); g.position.set(22, 0, 0); qs.add(g);
  const road = box(8, 0.04, 14, mat('#2a2d34')); road.position.set(0, 0.02, -2); g.add(road);
  for (let i = 0; i < 5; i++) { const w = 2.4 + R() * 1.0, h = 5 + R() * 4; const wt = windowTextures(300 + i, '#2e3442'); wt.map.repeat.set(w / 2, h / 2.5); wt.emi.repeat.set(w / 2, h / 2.5); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.5), new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffd890'), emissiveIntensity: 0.55 })); b.position.set(-5 + i * 2.6, h / 2, -5.2 - (i % 2)); g.add(b); }
  const pole = box(0.12, 3.6, 0.12, mat('#3a3c44')); pole.position.set(-1.1, 1.8, -0.6); g.add(pole);
  const arm = box(0.8, 0.08, 0.1, mat('#3a3c44')); arm.position.set(-0.75, 3.56, -0.6); g.add(arm);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe2a0' })); bulb.position.set(-0.4, 3.45, -0.6); g.add(bulb); }
const LAMP = new THREE.SpotLight(0xffd890, 0, 12, 0.6, 0.5, 0.9); LAMP.position.set(21.6, 3.45, -0.6); LAMP.target.position.set(22, 0, 0.2); qs.add(LAMP); qs.add(LAMP.target);
const lone = makePerson(HERO); lone.position.set(22, 0, 0.2); qs.add(lone);
const stranger = makePerson({ ...SUIT, shirt: '#1f2229', pants: '#16181d', hair: '#121212' }); stranger.position.set(26.5, 0, -0.6); qs.add(stranger);
const tPast = tag('つらい過去', { size: 76, w: 440, bg: 'rgba(10,12,18,.86)' }); tPast.position.set(22, 2.55, 0.2); qs.add(tPast);
const tUra = tag('裏の仕事', { size: 80, w: 400, bg: '#e2483c' }); tUra.position.set(23.3, 2.55, 0.2); qs.add(tUra);

// ---------- 3段目. ビルが立ち並ぶ大都会（x=44）。土地の値段が上がっていく ----------
const SKY = [];
for (let i = 0; i < 9; i++) { const w = 2.2 + R() * 1.6, h = 7 + R() * 12, d = 2.6; const wt = windowTextures(400 + i, ['#5a6478', '#6a7284', '#4e5668'][i % 3]); wt.map.repeat.set(w / 1.6, h / 1.8); wt.emi.repeat.set(w / 1.6, h / 1.8); const m = new THREE.MeshLambertMaterial({ map: wt.map, emissiveMap: wt.emi, emissive: new THREE.Color('#ffe2a8'), emissiveIntensity: 0.5 }); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(44 - 13.6 + i * 3.4, h / 2, -16 - (i % 3) * 2.2); b.castShadow = true; qs.add(b); SKY.push(b); }
// 建設中のクレーン（2基）
const CRANES = [];
for (const [x, z, h] of [[38.4, -14, 17], [50.2, -15, 20]]) { const g = new THREE.Group(); g.position.set(x, 0, z); const m = mat('#e0a838'); const mast = box(0.4, h, 0.4, m); mast.position.y = h / 2; g.add(mast); const jib = box(7, 0.3, 0.3, m); jib.position.set(1.8, h, 0); g.add(jib); const cw = box(0.8, 0.6, 0.5, mat('#5a5a5a')); cw.position.set(-1.4, h - 0.4, 0); g.add(cw); const line = box(0.03, 3, 0.03, mat('#2a2a2a')); line.position.set(4.4, h - 1.5, 0); g.add(line); const load = box(1.2, 0.4, 0.4, mat('#8a8a8a')); load.position.set(4.4, h - 3.1, 0); g.add(load); g.userData.load = load; g.userData.line = line; g.userData.h = h; qs.add(g); CRANES.push(g); }
// 上がっていく棒グラフ（数字なし）
const GRAPH = new THREE.Group(); GRAPH.position.set(44, 3.0, -1.5); qs.add(GRAPH);
const GBARS = [0.5, 0.7, 0.8, 1.1, 1.5, 2.1].map((h, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1, 0.42), new THREE.MeshBasicMaterial({ color: i === 5 ? '#e2483c' : '#e6b450', fog: false })); b.position.set(-1.5 + i * 0.6, 0, 0); b.userData.h = h; GRAPH.add(b); return b; });
const GARROW = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.5, 3), new THREE.MeshBasicMaterial({ color: '#e2483c' })); GRAPH.add(GARROW);
const tPrice = tag('土地の値段', { size: 74, w: 440, bg: '#14161c' }); tPrice.position.set(43.4, 6.1, -1.5); qs.add(tPrice);

// ---------- 4段目・クイズ. 円卓のチーム（x=66） ----------
const TX = 66;
const table = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.1, 48), wood); table.position.set(TX, 0.88, 0); table.castShadow = true; table.receiveShadow = true; qs.add(table);
{ const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 0.84, 20), mat('#2e2118')); leg.position.set(TX, 0.42, 0); qs.add(leg); }
const GOLD = [];
for (let L = 0; L < 3; L++) for (let k = 0; k < 3 - L; k++) { const b = new THREE.Mesh(barGeo, goldM); b.scale.setScalar(0.6); b.position.set(TX - 0.5 + k * 0.5 + L * 0.25, 1.0 + L * 0.135, -0.6); b.castShadow = true; qs.add(b); GOLD.push(b); }
const ROLES = ['リーダー', '交渉役', '情報屋', '法律屋', '手配師', '偽造屋'];
const ROLE_C = ['#1f2229', '#34405a', '#4a4e38', '#6b4d3a', '#5a3a4a', '#3e5a58'];
const TEAM = [], ROLE_TAG = [];
for (let i = 0; i < 6; i++) {
  const a = -Math.PI / 2 + i * (Math.PI * 2 / 6);
  const x = TX + Math.cos(a) * 2.35, z = Math.sin(a) * 2.35;
  const o = i === 1 ? HERO : i === 4 ? { skin: '#f1c9a5', hair: '#2c2421', shirt: ROLE_C[i], pants: '#2a2228', long: true, skirt: true } : { ...SUIT, shirt: ROLE_C[i], hair: i === 0 ? '#121212' : i === 3 ? '#4a4a4a' : '#2c2421' };
  const p = makePerson(o);
  p.position.set(x, 0, z); p.userData.face = Math.atan2(TX - x, -z); p.rotation.y = p.userData.face; qs.add(p); TEAM.push(p);
  const tg = tag(ROLES[i], { size: 62, w: 300, bg: i === 0 ? '#e6b450' : 'rgba(10,12,18,.86)', color: i === 0 ? '#14161c' : '#ffffff' });
  tg.position.set(TX + Math.cos(a) * 2.05, 2.5, Math.sin(a) * 2.05); qs.add(tg); ROLE_TAG.push(tg);
}
const leader = TEAM[0];
const t100 = tag('100億円', { size: 96, w: 460, h: 170, bg: '#e2483c' }); t100.position.set(TX, 1.5, 1.0); qs.add(t100);

// ---------- 5段目. 東京のオフィス街。標的は大手の開発会社（x=94） ----------
const BX = 94;
const TOWERS = [[BX, -6, 3.4, 16, 3.4, 11], [BX - 4, -8.5, 2.6, 10, 2.6, 12], [BX + 4.2, -9, 2.8, 12.5, 2.8, 13], [BX - 7.4, -10, 2.2, 7, 2.2, 14], [BX + 7.8, -11, 2.4, 8.5, 2.4, 15]];
const TOWER_M = [];
for (const [x, z, w, h, d, seed] of TOWERS) {
  const { map, emi } = windowTextures(seed, '#3a4458'); map.repeat.set(w / 1.4, h / 1.4); emi.repeat.set(w / 1.4, h / 1.4);
  const side = new THREE.MeshLambertMaterial({ map, emissive: 0xffffff, emissiveMap: emi, emissiveIntensity: 0.9 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, mat('#262d3c'), mat('#262d3c'), side, side]); m.position.set(x, h / 2, z); m.castShadow = true; qs.add(m); TOWER_M.push(m);
}
const watchers = [['#1f2229', -0.9, 2.2, 0.15], ['#34405a', 0, 2.5, 0], ['#6b4d3a', 0.9, 2.2, -0.15]].map(([c, dx, z, r], i) => { const p = makePerson(i === 1 ? HERO : { ...SUIT, shirt: c }); p.position.set(BX + dx, 0, z); p.rotation.y = Math.PI + r; qs.add(p); return p; });
const WARN = new THREE.PointLight(0xff3a2a, 0, 14, 1.2); WARN.position.set(BX, 3, 4); qs.add(WARN);
const tTokyo = tag('舞台は東京', { size: 76, w: 460, bg: '#e6b450', color: '#14161c' }); tTokyo.position.set(BX, 3.3, 1.6); qs.add(tTokyo);
const tTarget = tag('だます相手', { size: 76, w: 460, sx: 2.8, bg: '#e2483c' }); tTarget.position.set(BX, 7.4, -4.2); qs.add(tTarget);

// ---------- 6段目（決め手）. 本物の地主と、そっくりなニセモノ。書類にも偽のハンコ（x=120） ----------
const FX = 120;
{ const rug = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), mat('#2b3450')); rug.rotation.x = -Math.PI / 2; rug.position.set(FX, 0.02, 0); rug.receiveShadow = true; qs.add(rug);
  const low = box(3.6, 0.9, 1.2, wood); low.position.set(FX, 0.45, 1.5); qs.add(low); }
const owner = makePerson(OWNER); owner.position.set(FX - 0.7, 0, 0); qs.add(owner);
const fake = makePerson(OWNER); fake.position.set(FX + 0.7, 0, 0); qs.add(fake);
const fakeMats = []; fake.traverse(o => { if (o.isMesh && !fakeMats.includes(o.material)) fakeMats.push(o.material); });
fakeMats.forEach(m => { m.userData.base = m.color.clone(); });
const ownerMats = []; owner.traverse(o => { if (o.isMesh && !ownerMats.includes(o.material)) { o.material.transparent = true; ownerMats.push(o.material); } });
const BLACK = new THREE.Color('#07080b');
function tintFake(k) { fakeMats.forEach(m => m.color.copy(BLACK).lerp(m.userData.base, k)); }
const tReal = tag('本物', { size: 84, w: 300 }); tReal.position.set(FX - 0.7, 2.45, 0); qs.add(tReal);
const tFake = tag('ニセモノ', { size: 84, w: 420, bg: '#e2483c' }); tFake.position.set(FX + 0.7, 2.45, 0); qs.add(tFake);
const DOCS = [['旅券', 'PASSPORT', '#22365c', '#e3cf96'], ['運転免許証', 'LICENSE', '#f3efe4', '#2b2b2b'], ['登記済証', 'REGISTRY', '#f3efe4', '#2b2b2b']];
const DX = [FX - 1.15, FX, FX + 1.15];
const SEALS = [];
const fakeSeal = sealTex('偽');
DOCS.forEach(([jp, en, bg, ink], i) => {
  const tex = canvasTex(512, 690, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = ink; g.textAlign = 'center';
    g.font = `900 ${jp.length > 4 ? 66 : 84}px "Noto Sans CJK JP", sans-serif`; g.fillText(jp, w / 2, i === 0 ? 270 : 130);
    g.font = '700 32px "Noto Sans CJK JP", sans-serif'; g.fillText(en, w / 2, i === 0 ? 330 : 182);
    if (i === 0) { g.strokeStyle = ink; g.lineWidth = 7; g.beginPath(); g.arc(w / 2, 460, 72, 0, Math.PI * 2); g.stroke(); }
    else { g.fillStyle = 'rgba(40,40,40,.3)'; for (let y = 240; y < 630; y += 44) g.fillRect(64, y, w - 128 - ((y * 7) % 96), 14); }
  });
  const d = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.21), new THREE.MeshLambertMaterial({ map: tex })); d.rotation.x = -Math.PI / 2; d.rotation.z = (i - 1) * -0.06; d.position.set(DX[i], 0.905, 1.5); d.receiveShadow = true; qs.add(d);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshBasicMaterial({ map: fakeSeal, transparent: true, opacity: 0, depthWrite: false })); s.rotation.x = -Math.PI / 2; s.position.set(DX[i] + 0.18, 0.912, 1.72); qs.add(s); SEALS.push(s);
});
const hanko6 = makeHanko(); qs.add(hanko6);

// ---------- shots ----------
const ALLTAG = [tPast, tUra, tPrice, t100, tTokyo, tTarget, tReal, tFake, ...ROLE_TAG];
// 高いビルは、そのショットのときだけ出す（ほかのショットの背景に映りこまないように）
function base(set = '') { S.reset(); ALLTAG.forEach(x => x.visible = false); LAMP.intensity = 0; WARN.intensity = 0; S.spot.intensity = 0; [...SKY, ...CRANES, GRAPH].forEach(o => o.visible = set === 'city'); TOWER_M.forEach(o => o.visible = set === 'tokyo'); }
function walk(p, ph, k = 1) { p.userData.legs[0].rotation.x = Math.sin(ph) * 0.45 * k; p.userData.legs[1].rotation.x = -Math.sin(ph) * 0.45 * k; p.userData.arms[0].rotation.x = -Math.sin(ph) * 0.3 * k; p.userData.arms[1].rotation.x = Math.sin(ph) * 0.3 * k; }

function shotContract(t, T) { // 1段目 0〜9：契約の日。札束が机に積まれ、ハンコが押される（0秒目がサムネ）
  base(); S.aim(0, 0); lift(60);
  const slide = ease((T - 5.6) / 1.4); // 5.6秒〜：札束が売る側へ動く
  BUNDLES.forEach(b => { const u = clamp((T - b.userData.d) / 0.34); b.visible = u > 0; const h = b.userData.home; b.position.set(h.x, h.y + (1 - easeOut(u)) * 2.6, h.z - slide * 0.4); });
  stampAt(hanko1, [seal1], [0.78], [0.35], 0.905, 0.55, T);
  seller.userData.arms[0].rotation.x = -0.6 * slide; seller.userData.arms[1].rotation.x = -0.6 * slide;
  buyer1.userData.arms[1].rotation.x = -0.9 * clamp(1 - T / 1.0);
  const u = ease(T / 9);
  look(lerp(0.7, 0.2, u), lerp(4.4, 3.8, u), lerp(6.4, 5.4, u), lerp(0.1, -0.1, u), 0.85, -0.3, 54);
  return qs;
}
function shotMan(t) { // 2段目 9〜17：夜の路地。つらい過去を抱えた男に、黒いスーツの男が近づく
  base(); S.aim(22, 0); lift(0);
  S.hemi.intensity = 0.6; S.key.intensity = 0.12; S.darken(0.8, '#05070e');
  LAMP.intensity = 80;
  lone.rotation.y = lerp(0, 0.7, ease((t - 4.6) / 1.2)); lone.userData.head.rotation.x = lerp(0.35, 0, ease((t - 4.4) / 1.0));
  const k = ease((t - 3.8) / 2.4); stranger.position.set(lerp(26.5, 23.2, k), 0, lerp(-0.6, 0.4, k)); stranger.rotation.y = -Math.PI / 2 + 0.3; walk(stranger, t * 7, t > 3.8 && t < 6.2 ? 1 : 0);
  if (t > 6.2) stranger.userData.arms[0].rotation.x = -1.1 * ease((t - 6.2) / 0.6);
  tPast.userData.pop((t - 2.0) / 0.35);
  tUra.userData.pop((t - 6.0) / 0.35); if (t > 6.0) tPast.visible = false;
  const u = ease(t / 8);
  look(lerp(22.2, 22.8, u), lerp(1.9, 2.1, u), lerp(6.4, 6.0, u), lerp(22.1, 22.6, u), 1.3, 0, 52);
  return qs;
}
function shotCity(t) { // 3段目 17〜25：ビルが立ち並ぶ大都会。土地の値段が上がりはじめる
  base('city'); S.aim(44, -4); lift(0);
  S.darken(0.55, '#c27a52'); S.hemi.intensity = 1.0; S.key.intensity = 1.2;
  CRANES.forEach((c, i) => { const y = Math.sin(t * 0.6 + i) * 0.6; c.userData.load.position.y = c.userData.h - 3.1 + y; c.userData.line.scale.y = (3 - y) / 3; c.userData.line.position.y = c.userData.h - (3 - y) / 2; });
  GBARS.forEach((b, i) => { const k = easeOut(clamp((t - 3.6 - i * 0.28) / 0.5)); const h = Math.max(0.02, b.userData.h * k); b.scale.y = h; b.position.y = h / 2; b.visible = k > 0; });
  const last = GBARS[5]; GARROW.visible = t > 5.4; GARROW.position.set(last.position.x, last.userData.h + 0.4 + Math.sin(t * 5) * 0.05, 0);
  tPrice.userData.pop((t - 4.4) / 0.35);
  const u = ease(t / 8);
  look(lerp(43.4, 44.2, u), lerp(1.4, 2.4, u), lerp(9.6, 8.6, u), 44, lerp(7.0, 3.6, u), -3, 58);
  return qs;
}
function teamCam(a, r = 11.5, h = 7.4) { return [TX + Math.sin(a) * r, h, Math.cos(a) * r]; }
function shotTeam(t) { // 4段目 25〜33：リーダーのもとに、その道のプロが集まる。狙いは100億円
  base(); S.aim(TX, 0); lift(40);
  TEAM.forEach(p => { p.rotation.y = p.userData.face; });
  ROLE_TAG.forEach((x, i) => x.userData.pop((t - (1.0 + i * 0.3)) / 0.35));
  if (t > 3.9) ROLE_TAG.forEach(x => { x.visible = false; });
  t100.userData.pop((t - 4.0) / 0.35);
  const c = teamCam(lerp(-0.35, 0.35, ease(t / 8)), 12.2, 8.0);
  look(c[0], c[1], c[2], TX, 0.9, 0, 46);
  return qs;
}
function shotTokyo(t) { // 5段目 33〜42：舞台は東京。だます相手は大手の開発会社
  base('tokyo'); S.aim(BX, 0); lift(180);
  S.hemi.intensity = 0.8; S.key.intensity = 0.8; S.darken(0.35, '#06070a');
  tTokyo.userData.pop((t - 0.7) / 0.35);
  if (t > 4.2) tTokyo.visible = false;
  tTarget.userData.pop((t - 4.6) / 0.35);
  if (t > 4.6) { const k = t - 4.6; const p = Math.max(0, Math.sin(k * Math.PI * 2.2)) * clamp(1 - k / 3.6); WARN.intensity = 30 * p; S.scene.background.lerp(new THREE.Color('#5a1a16'), 0.5 * p); S.scene.fog.color.copy(S.scene.background); }
  watchers.forEach((p, i) => { p.userData.head.rotation.x = t > 4.0 ? -0.45 * ease((t - 4.0) / 0.8) : 0; });
  const u = ease(t / 9);
  look(BX, lerp(2.7, 2.2, u), lerp(9.8, 8.4, u), BX, lerp(2.4, 7.0, ease((t - 3.4) / 3)), -4, 54);
  return qs;
}
function shotFake(t) { // 6段目 42〜49（決め手）：本物の地主になりすまして、他人の土地を売る。書類も全部ニセモノ
  base(); S.aim(FX, 0); lift(110);
  const k = ease((t - 0.5) / 0.9); fake.scale.setScalar(Math.max(1e-4, k)); fake.visible = k > 0.001;
  tintFake(ease((t - 1.2) / 1.4));
  const fo = lerp(1, 0.35, ease((t - 3.3) / 1.0)); ownerMats.forEach(m => { m.opacity = fo; m.depthWrite = fo > 0.98; });
  tReal.userData.pop((t - 0.2) / 0.35); tReal.material.opacity = fo;
  tFake.userData.pop((t - 2.4) / 0.35);
  hanko6.visible = t > 3.4;
  stampAt(hanko6, SEALS, SEALS.map(s => s.position.x), [4.2, 4.9, 5.6], 0.905, 1.72, t);
  const u = ease(t / 7);
  look(FX, lerp(4.0, 4.4, u), lerp(7.4, 6.4, u), FX, lerp(1.3, 1.1, u), 0.7, 50);
  return qs;
}
function turnToLeader(k) {
  TEAM.forEach((p, i) => { if (!i) return; const r = p.userData.face; const lk = Math.atan2(leader.position.x - p.position.x, leader.position.z - p.position.z); let d = lk - r; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; p.rotation.y = r + d * k; });
}
function shotQuiz(t) { // 49〜56：このドラマ、わかった？（照明が落ちた円卓。リーダーにだけ赤い光）
  base(); S.aim(TX, 0); lift(200);
  const d = ease(t / 1.0);
  S.hemi.intensity = lerp(1.25, 0.14, d); S.key.intensity = lerp(1.5, 0, d); S.darken(d, '#06070a');
  S.spot.position.set(TX, 5.2, -1.4); S.spot.target.position.set(TX, 1.3, leader.position.z); S.spot.intensity = lerp(0, 60, ease((t - 0.4) / 1.0));
  turnToLeader(ease((t - 0.8) / 1.4));
  const c = teamCam(0.35), k = ease(t / 7);
  look(lerp(c[0], TX, k), lerp(c[1], 4.2, k), lerp(c[2], 7.2, k), TX, lerp(0.9, 1.3, k), lerp(0, -0.8, k), lerp(46, 44, k));
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: shotContract },
  { a: 9, b: 17, f: shotMan },
  { a: 17, b: 25, f: shotCity },
  { a: 25, b: 33, f: shotTeam },
  { a: 33, b: 42, f: shotTokyo },
  { a: 42, b: 49, f: shotFake },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];

// 字幕（ナレーションもこの文を字幕の時刻から読む）。56秒からの2行はまとめカードの下に隠れて、声だけになる
const SUBS = [
  [2.5, 5.6, '一生に一度の、<br>大きな買い物の契約。'],
  [5.6, 9.0, 'ハンコひとつで、<br>大金が動く。'],
  [9.2, 13.2, 'つらい過去を抱えた、<br>ひとりの男。'],
  [13.2, 17.0, '彼が加わったのは、<br>ある裏の仕事。'],
  [17.2, 21.0, 'ビルが立ち並ぶ、<br>大都会。'],
  [21.0, 25.0, '土地の値段が、<br>また上がりはじめた。'],
  [25.2, 29.0, 'リーダーのもとに、<br>その道のプロが集まる。'],
  [29.0, 33.0, '狙うのは、<br>100億円の土地。'],
  [33.2, 37.4, '舞台は東京。<br>巨額の不動産詐欺。'],
  [37.4, 41.8, 'だます相手は、<br>大手の開発会社。'],
  [42.2, 45.6, '本物の持ち主に<br>なりすまして、'],
  [45.6, 49.0, '他人の土地を売る。<br>書類も、全部ニセモノ。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、地面師たち。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotContract || f === shotFake,
  meta: {
    id: 'q001', v2: true, answer: '地面師たち',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 101,
    hits: [5.6, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.35, 5.6, 15.0, 29.0, 42.2, 46.2, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [37.6, 'alarm'], [42.0, 'whoosh'], [49.0, 'meter', 0.5]],
    narr: { '地面師': 'じめんし', '100億円': 'ひゃくおくえん', '一生に一度': 'いっしょうにいちど', '買い物': 'かいもの', '契約': 'けいやく', '大金': 'たいきん', '抱えた': 'かかえた', '過去': 'かこ', '加わった': 'くわわった', '裏の仕事': 'うらのしごと', '立ち並ぶ': 'たちならぶ', '大都会': 'だいとかい', '値段': 'ねだん', 'その道': 'そのみち', '狙う': 'ねらう', '舞台': 'ぶたい', '東京': 'とうきょう', '巨額': 'きょがく', '不動産詐欺': 'ふどうさんさぎ', '大手': 'おおて', '開発会社': 'かいはつがいしゃ', '本物': 'ほんもの', '持ち主': 'もちぬし', '他人': 'たにん', '書類': 'しょるい' },
    caption: 'このドラマのタイトル、わかる？\n一生に一度の、大きな買い物の契約。ハンコひとつで大金が動く。つらい過去を抱えたひとりの男が加わったのは、ある裏の仕事。ビルが立ち並ぶ大都会では、土地の値段がまた上がりはじめていた。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', 'ドラマ紹介', 'どんでん返し'],
  },
});

applyQuizCards({ answer: '地面師たち', info: 'Netflix｜全7話', answerSize: 128 });
