import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, poseWalk, rng } from '../lib.js';
import { lift, look, runStory, endCard } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #013 クロース（映画・スペインのアニメ・2019年。Netflixで見放題、justwatch.com/jp/映画/klaus で2026/11/2確認。Filmarks 4.1 filmarks.com/movies/82270）
// 設定：自分勝手な郵便配達員が、暗く凍てつく町に送られる。1年で手紙6000通というノルマつき（en.wikipedia.org/wiki/Klaus_(film) と highonfilms.com のレビューで2026/11/2確認）。町の人たちは長年いがみ合っている。人を寄せつけないおもちゃ職人と出会い、
//       ふたりで町におもちゃを届けることになる。ふたりの友情が町のわだかまりをほどいていく。サンタクロースの誕生にまつわる物語（Netflix の作品紹介・映画.com の解説）
// 構成：ヒント6段（ノルマ → 主人公 → 町の空気 → 職人との出会い → ふたりで届ける → あの人が生まれる物語）。町の名前・人物の名前・看板の文字は出さない
// 作品の絵・キャラクターのデザイン・ロゴ・有名な場面の構図（そりで空を飛ぶ場面など）は使わない。人と町は汎用の3D

const S = quizStage({ bg: '#8796ac', floor: '#e8eef4', fogNear: 18, fogFar: 60 });
const qs = S.scene;
const R = rng(1313);
const SNOW_M = mat('#f2f6fa');
const POST = { skin: '#f1c9a5', hair: '#2c2421', shirt: '#2f4a8a', pants: '#24304a' };
const MAKER = { skin: '#e8c0a0', hair: '#b8b4ac', shirt: '#5a4a38', pants: '#3a3028', scale: 1.28 };

// 雪（全ショット共通）
const SN = 900, snowPos = new Float32Array(SN * 3), snowBase = new Float32Array(SN * 3);
for (let i = 0; i < SN; i++) { snowBase.set([(R() - 0.5) * 30, R() * 14, (R() - 0.5) * 22], i * 3); }
const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snowTex = canvasTex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
const SNOW = new THREE.Points(snowGeo, new THREE.PointsMaterial({ map: snowTex, size: 0.09, transparent: true, depthWrite: false, color: 0xffffff })); SNOW.frustumCulled = false; qs.add(SNOW);
function snow(T, cx, cz) { for (let i = 0; i < SN; i++) { const y = ((snowBase[i * 3 + 1] - T * 0.8) % 14 + 14) % 14; snowPos[i * 3] = cx + snowBase[i * 3] + Math.sin(T * 0.7 + i) * 0.2; snowPos[i * 3 + 1] = y; snowPos[i * 3 + 2] = cz + snowBase[i * 3 + 2]; } snowGeo.attributes.position.needsUpdate = true; }

// ---------- 1. 暗く凍てつく町（x=0） ----------
const HOUSES = [];
function house(x, z, w, h, col, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; qs.add(g);
  const b = box(w, h, 2.4, mat(col)); b.position.y = h / 2; g.add(b);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1.0, w + 0.4, 3), mat('#5a4a44')); roof.rotation.z = Math.PI / 2; roof.scale.set(1, 1, 1.5); roof.position.y = h + 0.45; g.add(roof);
  const sn = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1.05, w + 0.5, 3), SNOW_M); sn.rotation.z = Math.PI / 2; sn.scale.set(1, 1, 1.5); sn.position.y = h + 0.53; g.add(sn);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.6), new THREE.MeshBasicMaterial({ color: '#2a2e38' })); win.position.set(-w * 0.22, h * 0.62, 1.21); g.add(win);
  const sh = box(0.8, 0.7, 0.05, mat('#4a3a30')); sh.position.set(-w * 0.22, h * 0.62, 1.24); g.add(sh);
  const door = box(0.7, 1.3, 0.06, mat('#3e2e26')); door.position.set(w * 0.2, 0.65, 1.22); g.add(door);
  const gift = new THREE.Group(); const gb = box(0.34, 0.3, 0.34, mat(['#c4302b', '#2f7a4a', '#e6b450'][HOUSES.length % 3])); gb.position.y = 0.15; gift.add(gb); const rb = box(0.36, 0.06, 0.08, mat('#f4f1ea')); rb.position.y = 0.3; gift.add(rb); const rb2 = box(0.08, 0.06, 0.36, mat('#f4f1ea')); rb2.position.y = 0.3; gift.add(rb2);
  gift.position.set(w * 0.2, 0, 1.55); gift.visible = false; g.add(gift);
  g.userData = { win: win.material, shutter: sh, gift };
  HOUSES.push(g); return g;
}
const HC = ['#6a6e78', '#7a6a60', '#5e6670', '#6e6458', '#646a74', '#72685e'];
[[-6.4, -4.5, 3.0, 2.6, 0.25], [-3.0, -5.6, 2.8, 3.2, 0.1], [0.4, -5.8, 3.0, 2.8, 0], [3.8, -5.6, 2.8, 3.4, -0.1], [7.0, -4.6, 3.0, 2.6, -0.25], [-8.0, -0.4, 2.8, 2.6, 0.9], [8.6, -0.6, 2.8, 2.8, -0.9]].forEach(([x, z, w, h, r], i) => house(x, z, w, h, HC[i % HC.length], r));
const POSTOFF = new THREE.Group(); POSTOFF.position.set(0.6, 0, -1.6); qs.add(POSTOFF);
{ const sT = canvasTex(512, 160, (g, w, h) => { g.fillStyle = '#c4302b'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.fillRect(w / 2 - 90, 30, 180, 100); g.strokeStyle = '#c4302b'; g.lineWidth = 8; g.beginPath(); g.moveTo(w / 2 - 90, 30); g.lineTo(w / 2, 90); g.lineTo(w / 2 + 90, 30); g.stroke(); });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), new THREE.MeshLambertMaterial({ map: sT })); s.position.set(0, 2.6, -2.75); POSTOFF.add(s); }
const postman = makePerson(POST); postman.position.set(0.3, 0, 0.8); qs.add(postman);
{ const cap = box(0.44, 0.12, 0.46, mat('#24304a')); cap.position.y = 0.52; postman.userData.head.add(cap); const v = box(0.44, 0.03, 0.18, mat('#1a1a22')); v.position.set(0, 0.47, 0.28); postman.userData.head.add(v);
  const bag = box(0.4, 0.42, 0.18, mat('#8a5a3a')); bag.position.set(0.32, 0.92, 0.1); postman.add(bag); const strap = box(0.06, 0.8, 0.04, mat('#6a4a2a')); strap.position.set(0.05, 1.3, 0.16); strap.rotation.z = -0.6; postman.add(strap); }
// ポスト（空っぽ）とノルマの札
const PBOX = new THREE.Group(); PBOX.position.set(-1.3, 0, 0.7); qs.add(PBOX);
{ const b = box(0.6, 1.1, 0.5, mat('#c4302b')); b.position.y = 0.75; PBOX.add(b); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16, 1, false, 0, Math.PI), mat('#c4302b')); top.rotation.z = Math.PI / 2; top.position.y = 1.3; PBOX.add(top);
  const slot = box(0.36, 0.05, 0.02, mat('#1a1a1a')); slot.position.set(0, 1.05, 0.26); PBOX.add(slot); const leg = box(0.16, 0.3, 0.16, mat('#2a2a2e')); leg.position.y = 0.1; PBOX.add(leg);
  const sn = box(0.64, 0.06, 0.34, SNOW_M); sn.position.set(0, 1.62, 0); PBOX.add(sn); }
const tQuota = tag('ノルマ 6000通', { size: 76, w: 560, bg: '#e2483c' }); qs.add(tQuota);
const tYear = tag('期限は1年', { size: 60, w: 380, bg: '#14161c' }); qs.add(tYear);
const tSelf = tag('自分勝手', { size: 66, w: 380, bg: '#e2483c' }); qs.add(tSelf);
const tPost = tag('郵便配達員', { size: 72, w: 440, bg: '#e6b450', color: '#14161c' }); tPost.position.set(0.3, 2.35, 0.8); qs.add(tPost);
// いがみ合う町の人たち
const LEFT = [], RIGHT = [];
for (let i = 0; i < 3; i++) { const l = makePerson({ skin: '#efcfae', hair: ['#1d1a19', '#6b4a33', '#9a9a9a'][i], shirt: ['#5a3a3a', '#6a4a40', '#4a3434'][i], pants: '#2a2a30' }); l.position.set(-1.0 - i * 0.6, 0, 1.9 - i * 0.55); l.rotation.y = Math.PI / 2; qs.add(l); LEFT.push(l);
  const r = makePerson({ skin: '#efcfae', hair: ['#2c2421', '#4a3426', '#1d1a19'][i], shirt: ['#34405a', '#3a4a5a', '#2a3448'][i], pants: '#2a2a30', long: i === 1 }); r.position.set(1.0 + i * 0.6, 0, 1.9 - i * 0.55); r.rotation.y = -Math.PI / 2; qs.add(r); RIGHT.push(r); }
const tFeud = tag('長年いがみ合い', { size: 66, w: 520, bg: '#e2483c' }); tFeud.position.set(0, 2.75, 1.6); qs.add(tFeud);
const LIGHTS = [];
for (let i = 0; i < 18; i++) { const c = ['#e2483c', '#e6b450', '#4fa36b', '#4f8ad1'][i % 4]; const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: c })); const u = i / 17; b.position.set(lerp(-5.5, 5.5, u), 3.3 - Math.sin(u * Math.PI) * 0.6, -2.6); qs.add(b); LIGHTS.push(b); }
const WARM = new THREE.PointLight(0xffc880, 0, 16, 1.2); WARM.position.set(0, 3.5, 1); qs.add(WARM);

// ---------- 2. 森の奥の小屋（x=40） ----------
const CABIN = new THREE.Group(); CABIN.position.set(40, 0, -2.5); qs.add(CABIN);
{ const w = box(4.4, 2.6, 3.4, mat('#6a4a30')); w.position.y = 1.3; CABIN.add(w);
  for (let i = 0; i < 6; i++) { const lg = box(4.5, 0.08, 3.5, mat('#4a3020')); lg.position.y = 0.3 + i * 0.42; CABIN.add(lg); }
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 2.0, 5.0, 3), mat('#3a2a20')); roof.rotation.z = Math.PI / 2; roof.scale.set(1, 1, 1.25); roof.position.y = 3.3; CABIN.add(roof);
  const sn = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 2.06, 5.1, 3), SNOW_M); sn.rotation.z = Math.PI / 2; sn.scale.set(1, 1, 1.25); sn.position.y = 3.4; CABIN.add(sn);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.8), new THREE.MeshBasicMaterial({ color: '#ffd890' })); win.position.set(-1.1, 1.5, 1.72); CABIN.add(win);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.9), new THREE.MeshBasicMaterial({ color: '#ffc870' })); door.position.set(0.9, 0.95, 1.72); CABIN.add(door); }
for (let i = 0; i < 30; i++) { const x = 40 + (R() - 0.5) * 26, z = -5 - R() * 12; if (Math.abs(x - 40) < 3 && z > -7) continue; const t = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.2, 8), mat('#2f4a3a')); t.position.set(x, 1.6, z); qs.add(t); const c = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.0, 8), SNOW_M); c.position.set(x, 2.9, z); qs.add(c); }
const maker = makePerson(MAKER); maker.position.set(41.4, 0, 0.0); maker.rotation.y = -0.5; qs.add(maker);
const BEARD = mat('#b8b4ac');
{ const beard = box(0.42, 0.34, 0.12, BEARD); beard.position.set(0, 0.06, 0.2); maker.userData.head.add(beard); }
// 職人の服は前半は地味な茶色。6段目（あの人が生まれる物語）でだけ赤に変える
const MAKER_SHIRT = maker.children.find(c => c.isMesh && Math.abs(c.position.y - 1.17) < 1e-6).material;
function makerRed(on) { MAKER_SHIRT.color.set(on ? '#b22a24' : '#5a4a38'); BEARD.color.set(on ? '#eeeeee' : '#b8b4ac'); }
const postman2 = makePerson(POST); postman2.position.set(38.6, 0, 0.6); postman2.rotation.y = 0.6; qs.add(postman2);
{ const cap = box(0.44, 0.12, 0.46, mat('#24304a')); cap.position.y = 0.52; postman2.userData.head.add(cap); }
const BENCH = new THREE.Group(); BENCH.position.set(40, 0, 0.9); qs.add(BENCH);
{ const t = box(2.2, 0.08, 0.8, mat('#8a6a4a')); t.position.y = 0.8; BENCH.add(t); for (const [x, z] of [[-1, -0.3], [1, -0.3], [-1, 0.3], [1, 0.3]]) { const l = box(0.08, 0.8, 0.08, mat('#6a4a30')); l.position.set(x, 0.4, z); BENCH.add(l); }
  const TOYC = ['#c4302b', '#2f7a4a', '#e6b450', '#4f8ad1', '#f4f1ea'];
  for (let i = 0; i < 5; i++) { const toy = new THREE.Group(); const k = i % 3; if (k === 0) { const b = box(0.3, 0.16, 0.12, mat(TOYC[i])); b.position.y = 0.2; toy.add(b); const h = box(0.1, 0.16, 0.1, mat(TOYC[i])); h.position.set(0.15, 0.32, 0); toy.add(h); for (const x of [-0.1, 0.1]) { const l = box(0.04, 0.12, 0.1, mat('#5a3a20')); l.position.set(x, 0.06, 0); toy.add(l); } }
    else if (k === 1) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 12), mat(TOYC[i])); c.rotation.x = Math.PI; c.position.y = 0.11; toy.add(c); }
    else { for (let j = 0; j < 3; j++) { const b = box(0.12, 0.12, 0.12, mat(TOYC[(i + j) % 5])); b.position.set(j * 0.06 - 0.06, 0.06 + j * 0.12, 0); toy.add(b); } }
    toy.position.set(-0.85 + i * 0.42, 0.84, 0); BENCH.add(toy); } }
const tMaker = tag('おもちゃ職人', { size: 70, w: 460, bg: '#e6b450', color: '#14161c' }); tMaker.position.set(40.9, 2.95, 0.0); qs.add(tMaker);
const CABL = new THREE.PointLight(0xffc880, 6, 8, 1.2); CABL.position.set(40, 2.2, 1.5); qs.add(CABL);

// ふたりで運ぶ袋
const SACK = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), mat('#8a6a4a')); SACK.scale.set(1, 1.2, 0.9); qs.add(SACK);
const tTogether = tag('ふたりで届ける', { size: 66, w: 500, bg: '#e6b450', color: '#14161c' }); qs.add(tTogether);

// ---------- shots ----------
const ALL = [tPost, tFeud, tMaker, tTogether, tQuota, tYear, tSelf];
function base() {
  S.reset(); ALL.forEach(x => x.visible = false); WARM.intensity = 0; SACK.visible = false; LIGHTS.forEach(b => b.visible = false);
  HOUSES.forEach(h => { h.userData.win.color.set('#2a2e38'); h.userData.shutter.visible = true; h.userData.gift.visible = false; });
  S.hemi.intensity = 0.9; S.key.intensity = 0.7;
  postman.visible = true; postman.position.set(0.3, 0, 0.8); postman.rotation.set(0, 0, 0); PBOX.visible = false; makerRed(false); maker.position.set(41.4, 0, 0); maker.rotation.y = -0.5; postman2.position.set(38.6, 0, 0.6); postman2.rotation.y = 0.6;
  [...LEFT, ...RIGHT].forEach(p => p.visible = false);
}
function shotQuota(t, T) { // 0〜9：いきなり課されたノルマ。町の家々が次々と窓を閉める（0秒目がサムネ）
  base(); S.aim(0, -2); lift(0); snow(T, 0, -2); PBOX.visible = true;
  S.hemi.intensity = 0.75; S.key.intensity = 0.5; S.darken(0.2, '#1a2236');
  HOUSES.forEach((h, i) => { const shut = T > 0.9 + i * 0.55; h.userData.win.color.set(shut ? '#2a2e38' : '#ffd890'); h.userData.shutter.visible = shut; });
  postman.rotation.y = Math.sin(T * 0.6) * 0.3; postman.userData.head.rotation.y = Math.sin(T * 1.1) * 0.5;
  tQuota.position.set(-0.3, 2.85, 0.6); tQuota.userData.pop(1); // 0秒目から出しておく（サムネのつかみ）
  tYear.position.set(-0.3, 2.3, 0.6); tYear.userData.pop((T - 6.6) / 0.35);
  const u = ease(T / 9);
  look(lerp(0.2, 0.0, u), lerp(2.3, 2.0, u), lerp(7.6, 6.4, u), -0.3, lerp(1.9, 1.8, u), -1, 54);
  return qs;
}
function shotTown(t, T) { // 9〜17：自分勝手な郵便配達員。来たのも、しかたなく
  base(); S.aim(0, -2); lift(0); snow(T, 0, -2);
  S.hemi.intensity = 0.8; S.key.intensity = 0.6;
  PBOX.visible = false;
  postman.rotation.y = Math.sin(t * 0.6) * 0.35; postman.userData.head.rotation.y = Math.sin(t * 0.9) * 0.4;
  postman.userData.arms.forEach(a => a.rotation.x = -0.15);
  tPost.position.set(0.3, 2.35, 0.8); tPost.userData.pop((t - 0.4) / 0.35);
  tSelf.position.set(0.3, 3.0, 0.8); tSelf.userData.pop((t - 1.6) / 0.35);
  const u = ease(t / 8);
  look(lerp(1.4, 0.6, u), lerp(2.2, 2.0, u), lerp(5.6, 4.8, u), 0.3, 1.7, 0.4, 54);
  return qs;
}
function shotFeud(t, T) { // 9〜17：いがみ合う町の人たち
  base(); S.aim(0, 0); lift(80); snow(T, 0, 0); PBOX.visible = false;
  postman.position.set(0.0, 0, -1.2); postman.rotation.y = 0;
  [...LEFT, ...RIGHT].forEach((p, i) => { p.visible = true; const side = i < 3 ? -1 : 1, j = i % 3; p.position.set(side * (1.0 + j * 0.6), 0, 1.9 - j * 0.55); p.rotation.y = -side * Math.PI / 2; const lean = Math.sin(t * 3 + i) * 0.05 + 0.12; p.rotation.x = lean; p.userData.arms.forEach(a => a.rotation.x = -0.2 - Math.abs(Math.sin(t * 2.4 + i)) * 0.25); });
  tFeud.userData.pop((t - 1.6) / 0.35);
  const u = ease(t / 8);
  look(lerp(0.0, 0.0, u), lerp(2.4, 2.8, u), lerp(8.4, 7.6, u), 0, 1.4, 0.6, 54);
  return qs;
}
function shotCabin(t, T) { // 17〜25：森の奥の、人を寄せつけないおもちゃ職人
  base(); S.aim(40, -1); lift(60); snow(T, 40, -1);
  S.hemi.intensity = 0.7;
  maker.userData.head.rotation.y = Math.sin(t * 0.5) * 0.2;
  tMaker.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(40.6, 40.2, u), lerp(2.6, 2.3, u), lerp(9.6, 7.6, u), 40.2, 1.5, 0, 54);
  return qs;
}
function deliver(t, night, x1 = 5.0) { // ふたりが家々をまわる
  const path = t / 8;
  const x = lerp(-5.4, x1, path);
  postman.position.set(x, 0, -0.2); postman.rotation.y = Math.PI / 2; poseWalk(postman, t * 6, 1); postman.position.y = 0;
  maker.position.set(x - 1.1, 0, 0.2); maker.rotation.y = Math.PI / 2; poseWalk(maker, t * 5, 0.8); maker.position.y = 0;
  SACK.visible = true; SACK.position.set(x - 1.55, 1.5, 0.2);
  HOUSES.slice(0, 5).forEach((h, i) => { const hx = h.position.x; h.userData.gift.visible = x > hx + 0.3; if (night) h.userData.win.color.set(x > hx + 0.3 ? '#ffd890' : '#2a2e38'); h.userData.shutter.visible = !(x > hx + 0.3 && night); });
}
function shotChange(t, T) { // 33〜42：ふたりで町におもちゃを届けるうち、町が変わっていく
  base(); S.aim(0, -2); lift(60); snow(T, 0, -2); PBOX.visible = false;
  S.hemi.intensity = 0.6; S.key.intensity = 0.3; S.darken(0.45, '#1a2236');
  deliver(Math.min(t, 5.6) * 8 / 5.6, true, 1.4);
  if (t > 5.6) { postman.userData.arms.forEach(a => a.rotation.x = 0); maker.userData.arms.forEach(a => a.rotation.x = 0); postman.userData.legs.forEach(a => a.rotation.x = 0); maker.userData.legs.forEach(a => a.rotation.x = 0); }
  tTogether.position.set(postman.position.x - 0.5, 3.4, 0); tTogether.userData.pop((t - 0.8) / 0.35); if (t > 5.0) tTogether.visible = false;
  const k = clamp((t - 4.4) / 3.5);
  HOUSES.forEach((h, i) => { if (i >= 3) { const on = k > (i - 3) / 4 + 0.1; if (i < 5) h.userData.gift.visible = on; h.userData.win.color.set(on ? '#ffd890' : '#2a2e38'); h.userData.shutter.visible = !on; } });
  LIGHTS.forEach((b, i) => b.visible = k > 0.2 + i / 40);
  WARM.intensity = 14 * k;
  [...LEFT, ...RIGHT].forEach((p, i) => { p.visible = k > 0.15; p.rotation.x = 0; p.userData.arms.forEach(a => a.rotation.x = 0); const side = i < 3 ? -1 : 1, j = i % 3; p.position.set(side * lerp(3.4 + j * 0.6, 1.7 + j * 0.6, ease((t - 5.0) / 3)), 0, 1.6 - j * 0.5); p.rotation.y = -side * Math.PI / 2; });
  const u = ease(t / 9), w = ease((t - 4.6) / 3.6);
  const px = postman.position.x - 0.55;
  look(lerp(px + 0.2, 0, w), lerp(2.4, 3.4, w), lerp(7.6, 10.0, w), lerp(px, 0, w), lerp(1.5, 1.8, w), lerp(-1.6, -1.2, w), 54);
  return qs;
}
const DARK = '#0b1020';
function shotTwist(t, T) { // 42〜49：町の上の夜空へ
  base(); S.aim(0, -2); lift(lerp(0, 300, ease(t / 7))); snow(T, 0, -2); makerRed(t > 3.2);
  const d = ease(t / 1.5); S.hemi.intensity = lerp(0.6, 0.3, d); S.key.intensity = lerp(0.3, 0, d); S.darken(lerp(0.45, 0.9, d), DARK);
  HOUSES.forEach((h, i) => { h.userData.win.color.set('#ffd890'); h.userData.shutter.visible = false; h.userData.gift.visible = i < 5; });
  LIGHTS.forEach(b => b.visible = true); WARM.intensity = 14;
  [...LEFT, ...RIGHT].forEach((p, i) => { p.visible = true; const side = i < 3 ? -1 : 1, j = i % 3; p.position.set(side * (1.5 + j * 0.6), 0, 1.4 - j * 0.5); p.rotation.y = -side * Math.PI / 2; p.rotation.x = 0; });
  postman.position.set(-0.6, 0, -0.6); postman.rotation.y = 0.2; maker.position.set(0.9, 0, -0.9); maker.rotation.y = -0.2;
  const k = ease(t / 7);
  look(0, lerp(3.2, 9.0, k), lerp(9.0, 12.5, k), 0, lerp(1.7, 2.2, k), -1.6, 56);
  return qs;
}
function shotQuiz(t, T) { // 49〜56：この映画、わかった？
  shotTwist(7, T); lift(300); S.hemi.intensity = 0.3; S.key.intensity = 0; S.darken(0.9, DARK);
  const k = ease(t / 7);
  look(0, lerp(9.0, 10.5, k), lerp(12.5, 14.5, k), 0, 2.2, -1.6, 56);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotQuota(t, T) },
  { a: 9, b: 17, f: (t, T) => shotTown(t, T) },
  { a: 17, b: 25, f: (t, T) => shotFeud(t, T) },
  { a: 25, b: 33, f: (t, T) => shotCabin(t, T) },
  { a: 33, b: 42, f: (t, T) => shotChange(t, T) },
  { a: 42, b: 49, f: (t, T) => shotTwist(t, T) },
  { a: 49, b: 56, f: (t, T) => shotQuiz(t, T) },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'いきなり課された<br>ノルマは、'],
  [5.6, 9.0, '1年で、<br>手紙6000通。'],
  [9.2, 13.2, '彼は、自分勝手な<br>郵便配達員。'],
  [13.2, 17.0, 'この町に来たのも、<br>しかたなく。'],
  [17.2, 21.0, '町の人たちは、<br>長年いがみ合い、'],
  [21.0, 25.0, '空気は、<br>冷えきっていた。'],
  [25.2, 29.0, 'そこで出会ったのは、<br>人を寄せつけない'],
  [29.0, 33.0, '町はずれの<br>おもちゃ職人。'],
  [33.2, 37.4, 'ふたりで町に<br>おもちゃを届けるうち、'],
  [37.4, 41.8, 'その友情が、<br>凍てついた町を変えていく。'],
  [42.2, 45.4, '実はこれ、<br>誰もが知っている'],
  [45.4, 49.0, 'あの人が<br>生まれるまでの物語。'],
  [49.2, 52.0, 'この映画、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、クロース。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => false,
  meta: {
    id: 'q013', v2: true, answer: 'クロース',
    title: 'この映画のタイトルは？',
    titleHtml: 'この映画の<br>タイトルは？',
    mood: 'hopeful', seed: 1313,
    hits: [5.6, 29.0, 56.4], risers: [52.0],
    impacts: [0.3, 5.7, 29.0, 37.4, 45.4, 56.4],
    sfx: [[0.2, 'whoosh'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.2, 'drone'], [49.0, 'meter', 0.5]],
    narr: { '6000通': 'ろくせんつう', '自分勝手': 'じぶんかって', '郵便配達員': 'ゆうびんはいたついん', '凍てついた': 'いてついた', '課された': 'かされた', '1年': 'いちねん', '手紙': 'てがみ', '長年': 'ながねん', '空気': 'くうき', '冷えきって': 'ひえきって', '出会った': 'であった', '寄せつけない': 'よせつけない', '町はずれ': 'まちはずれ', '職人': 'しょくにん', '届ける': 'とどける', '友情': 'ゆうじょう', '誰もが': 'だれもが', '生まれる': 'うまれる', '物語': 'ものがたり' },
    caption: 'この映画のタイトル、わかる？\nいきなり課されたノルマは、1年で手紙6000通。彼は、自分勝手な郵便配達員。たどり着いた町では、人たちが長年いがみ合っていた。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '映画好き', '名作映画'],
  },
});
applyQuizCards({ answer: 'クロース', info: 'Netflix｜スペインのアニメ映画', answerSize: 128 });
