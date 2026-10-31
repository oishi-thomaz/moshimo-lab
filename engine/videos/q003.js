import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard, setTop } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #003 ペーパー・ハウス（ドラマ・スペイン・パート1〜5。Netflixで見放題、2026/10確認）
// 設定：「教授」と呼ばれる男が犯罪者8人を集め、造幣局に立てこもって24億ユーロを刷る（ciatr 作品紹介）
// 作品の映像・衣装・仮面・ロゴは使わず、設定だけを汎用の3Dで見せる。メンバーの服は作品とちがう色にする

const S = quizStage({ bg: '#18202c', floor: '#2a3140', fogNear: 26, fogFar: 80 });
const qs = S.scene;
const R = rng(303);

const SUIT = { skin: '#efcfae', hair: '#1d1a19', shirt: '#2b3040', pants: '#22262f', tie: true };
const CREW = { skin: '#efcfae', hair: '#1d1a19', shirt: '#2f3b4f', pants: '#2f3b4f' };
const OFFICE = (i) => ({ skin: ['#efcfae', '#e8b98f', '#f5d3b5', '#d9a57c'][i % 4], hair: ['#2c2421', '#4a3426', '#9a9a9a', '#1a1a22'][i % 4], shirt: ['#e9e4da', '#4fa3d1', '#c94f7c', '#59606e', '#f2c14e'][i % 5], pants: ['#2b3346', '#3b3f4a', '#5a4a3a'][i % 3], long: i % 2 === 1, skirt: i % 4 === 1 });
const POLICE = { skin: '#efcfae', hair: '#1d1a19', shirt: '#24324f', pants: '#1c2232' };
function glasses(p) { const h = p.userData.head; const m = mat('#111111'); for (const s of [-1, 1]) { const f = box(0.14, 0.1, 0.02, m); f.position.set(s * 0.09, 0.27, 0.205); h.add(f); } const br = box(0.06, 0.02, 0.02, m); br.position.set(0, 0.29, 0.205); h.add(br); }
function cap(p, color = '#1c2232') { const h = p.userData.head; const c = box(0.44, 0.14, 0.44, mat(color)); c.position.y = 0.52; h.add(c); const v = box(0.4, 0.03, 0.18, mat(color)); v.position.set(0, 0.46, 0.27); h.add(v); }

// パトカー（架空の白黒、ロゴなし）。lights(t) で赤と青が交互に光る
function policeCar() {
  const g = new THREE.Group();
  const body = box(2.0, 0.6, 1.0, mat('#e9edf2')); body.position.y = 0.45; g.add(body);
  const stripe = box(2.02, 0.16, 1.02, mat('#1f3f8a')); stripe.position.y = 0.45; g.add(stripe);
  const cab = box(1.1, 0.45, 0.9, mat('#2a3242')); cab.position.set(-0.1, 0.95, 0); g.add(cab);
  for (const [x, z] of [[-0.65, 0.5], [0.65, 0.5], [-0.65, -0.5], [0.65, -0.5]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 14), mat('#111')); w.rotation.x = Math.PI / 2; w.position.set(x, 0.2, z); g.add(w); }
  const rM = new THREE.MeshBasicMaterial({ color: '#ff2a2a' }), bM = new THREE.MeshBasicMaterial({ color: '#2a5bff' });
  const r = box(0.3, 0.12, 0.3, rM); r.position.set(-0.25, 1.24, 0); g.add(r);
  const b = box(0.3, 0.12, 0.3, bM); b.position.set(0.15, 1.24, 0); g.add(b);
  const pl = new THREE.PointLight(0xff2a2a, 0, 8, 1.4); pl.position.set(0, 1.6, 0); g.add(pl);
  g.userData.lights = (t) => { const on = Math.floor(t * 6) % 2 === 0; rM.color.set(on ? '#ff2a2a' : '#3a0a0a'); bM.color.set(on ? '#0c1a40' : '#2a5bff'); pl.color.set(on ? 0xff2a2a : 0x2a5bff); pl.intensity = 6; };
  return g;
}

// ---------- 1. 造幣局の前（x=0） ----------
const MINT = new THREE.Group(); MINT.position.set(0, 0, -5); qs.add(MINT);
{ const stone = mat('#cfc6b4'), dark = mat('#8a8272');
  const main = box(11, 4.4, 3.4, stone); main.position.y = 2.2 + 0.6; MINT.add(main);
  for (let i = 0; i < 3; i++) { const st = box(8 - i * 0.6, 0.2, 1.2 - i * 0.3, dark); st.position.set(0, 0.1 + i * 0.2, 2.2 - i * 0.3); MINT.add(st); }
  const base = box(11.4, 0.6, 3.8, dark); base.position.y = 0.3; MINT.add(base);
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 3.6, 16), stone); c.position.set(-3.75 + i * 1.5, 2.4, 1.95); c.castShadow = true; MINT.add(c); }
  const lint = box(8.6, 0.5, 0.6, stone); lint.position.set(0, 4.45, 1.95); MINT.add(lint);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 4.6, 1.3, 3, 1), stone); ped.rotation.set(Math.PI / 2, 0, 0); ped.scale.set(1, 0.3, 1);
  const tri = new THREE.Shape(); tri.moveTo(-4.4, 0); tri.lineTo(4.4, 0); tri.lineTo(0, 1.3); tri.lineTo(-4.4, 0);
  const pedM = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.5, bevelEnabled: false }), stone); pedM.position.set(0, 4.7, 1.7); MINT.add(pedM);
  const signT = canvasTex(1024, 128, (g, w, h) => { g.fillStyle = '#cfc6b4'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3428'; g.font = '900 84px "Noto Serif CJK JP", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('国 立 造 幣 局', w / 2, h / 2 + 6); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.75), new THREE.MeshLambertMaterial({ map: signT })); sign.position.set(0, 4.45, 2.27); MINT.add(sign);
  const door = box(1.4, 2.4, 0.1, mat('#3a2e22')); door.position.set(0, 1.9, 1.72); MINT.add(door);
  for (let i = 0; i < 4; i++) { const w = box(0.8, 1.2, 0.08, mat('#2a3242')); w.position.set(-3.75 + (i < 2 ? i : i + 2) * 1.5 + 0.75, 2.6, 1.72); MINT.add(w); }
}
const CARS1 = [[-3.4, 2.6, 0.5], [3.6, 2.2, -0.4], [0.4, 4.6, 0.1]].map(([x, z, r]) => { const c = policeCar(); c.position.set(x, 0, z); c.rotation.y = r; qs.add(c); return c; });
const COPS1 = [[-1.8, 3.4], [1.9, 3.6], [-0.2, 3.0]].map(([x, z]) => { const p = makePerson(POLICE); cap(p); p.position.set(x, 0, z); p.rotation.y = Math.PI; qs.add(p); return p; });

// ---------- 2. 教授の隠れ家（x=20） ----------
const den = new THREE.Group(); den.position.set(20, 0, 0); qs.add(den);
{ const fl = box(6, 0.1, 6, mat('#4a3e33')); fl.position.y = -0.05; den.add(fl);
  const back = box(6, 4, 0.2, mat('#5d6a63')); back.position.set(0, 2, -3); den.add(back);
  const left = box(0.2, 4, 6, mat('#56625c')); left.position.set(-3, 2, 0); den.add(left);
  const planT = canvasTex(768, 512, (g, w, h) => { g.fillStyle = '#1f3a5a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d8e6f2'; g.lineWidth = 5; g.strokeRect(40, 40, w - 80, h - 80);
    g.lineWidth = 3; for (const [x, y, ww, hh] of [[60, 60, 260, 170], [340, 60, 180, 120], [540, 60, 170, 260], [60, 250, 300, 200], [380, 200, 140, 250]]) g.strokeRect(x, y, ww, hh);
    g.strokeStyle = '#ff5a4a'; g.lineWidth = 6; g.setLineDash([16, 10]); g.beginPath(); g.moveTo(70, 470); g.lineTo(200, 330); g.lineTo(450, 320); g.lineTo(620, 150); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#ff5a4a'; g.beginPath(); g.arc(620, 150, 14, 0, Math.PI * 2); g.fill(); });
  const plan = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.0), new THREE.MeshLambertMaterial({ map: planT })); plan.position.set(0.6, 2.4, -2.88); den.add(plan);
  for (const [x, y] of [[-0.6, 3.25], [1.7, 3.3], [-0.5, 1.5], [1.9, 1.6]]) { const pin = box(0.22, 0.16, 0.02, mat('#f2e6a0')); pin.position.set(x, y, -2.86); pin.rotation.z = (x * 3) % 0.4 - 0.2; den.add(pin); }
  const desk = box(2.4, 0.9, 1.1, mat('#5a4030')); desk.position.set(0.4, 0.45, -1.6); den.add(desk);
  const radio = box(0.6, 0.35, 0.3, mat('#2b2b2b')); radio.position.set(-0.3, 1.08, -1.7); den.add(radio);
  const ant = box(0.03, 0.5, 0.03, mat('#999')); ant.position.set(-0.5, 1.45, -1.7); den.add(ant);
  const phone = box(0.4, 0.14, 0.24, mat('#7a1f1f')); phone.position.set(0.9, 0.97, -1.5); den.add(phone);
  const lampL = new THREE.PointLight(0xffd59a, 4, 6, 1.4); lampL.position.set(1.2, 1.9, -1.4); den.add(lampL);
  const lampS = box(0.3, 0.2, 0.3, mat('#2d6b45')); lampS.position.set(1.4, 1.5, -1.7); den.add(lampS);
}
const prof = makePerson({ ...SUIT, shirt: '#5c5145', hair: '#2c2421' }); glasses(prof); prof.position.set(19.6, 0, -0.6); prof.rotation.y = 0.35; qs.add(prof);
const tProf = tag('教授', { size: 84, bg: '#e6b450', color: '#14161c' }); tProf.position.set(19.6, 2.6, -0.6); qs.add(tProf);
const tOut = tag('中には入らない', { size: 72, bg: '#e2483c' }); tOut.position.set(20.4, 2.65, -0.6); qs.add(tOut);

// ---------- 3. 印刷室（x=40） ----------
const room3 = new THREE.Group(); room3.position.set(40, 0, 0); qs.add(room3);
{ const back = box(12, 5, 0.2, mat('#7d8578')); back.position.set(0, 2.5, -4.5); room3.add(back); }
const PRESS = [], STACKS = [];
const billT = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#b9c9a6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6e8a5c'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20); g.fillStyle = '#8aa074'; g.beginPath(); g.arc(w / 2, h / 2, 30, 0, Math.PI * 2); g.fill(); });
const billTop = new THREE.MeshLambertMaterial({ map: billT }), billSide = mat('#d8e2c6');
for (let i = 0; i < 3; i++) {
  const x = -3.2 + i * 3.2;
  const m = new THREE.Group(); m.position.set(x, 0, -1.6); room3.add(m);
  const bodyP = box(2.0, 1.4, 1.4, mat('#4a5568')); bodyP.position.y = 0.7; m.add(bodyP);
  const top = box(1.8, 0.4, 1.2, mat('#2f3846')); top.position.y = 1.6; m.add(top);
  const rolls = []; for (let k = 0; k < 3; k++) { const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.3, 14), mat('#9aa3ae')); rl.rotation.x = Math.PI / 2; rl.position.set(-0.6 + k * 0.6, 1.95, 0); m.add(rl); rolls.push(rl); }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: '#7dff9a' })); lamp.position.set(0.8, 1.5, 0.71); m.add(lamp);
  PRESS.push(rolls);
  const st = new THREE.Group(); st.position.set(x, 0, 0.2); room3.add(st);
  const layers = []; for (let k = 0; k < 14; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.45), [billSide, billSide, billTop, billSide, billSide, billSide]); b.position.set((k % 2) * 0.05 - 0.02, 0.06 + k * 0.12, 0); b.rotation.y = (k % 3) * 0.03; b.castShadow = true; st.add(b); layers.push(b); }
  STACKS.push(layers);
}
const HOST = []; for (let i = 0; i < 7; i++) { const p = makePerson(OFFICE(i)); p.position.set(43.2 + (i % 4) * 0.7, 0, -3.4 + Math.floor(i / 4) * 0.7); p.rotation.y = -0.4 + (R() - 0.5) * 0.4; p.userData.arms.forEach(a => { a.rotation.x = -2.9; a.rotation.z = 0; }); qs.add(p); HOST.push(p); }
const tHost = tag('人質', { size: 84, bg: '#e2483c' }); tHost.position.set(44.2, 2.75, -3.0); qs.add(tHost);
const guard3 = makePerson(CREW); guard3.position.set(41.6, 0, -1.6 + 1.9); guard3.rotation.y = -0.9; qs.add(guard3);

// ---------- 4〜7. 8人のメンバー（x=60） ----------
const vault = new THREE.Group(); vault.position.set(60, 0, 0); qs.add(vault);
{ const back = box(14, 5, 0.2, mat('#5a6070')); back.position.set(0, 2.5, -3.2); vault.add(back);
  const door = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.4, 32), mat('#9aa3ae')); door.rotation.x = Math.PI / 2; door.position.set(0, 2.2, -3.0); vault.add(door);
  for (let k = 0; k < 6; k++) { const sp = box(0.12, 1.2, 0.12, mat('#6c7480')); sp.position.set(0, 2.2, -2.75); sp.rotation.z = k * Math.PI / 6; vault.add(sp); } }
const CITY = ['東京', 'ベルリン', 'リオ', 'ナイロビ', 'デンバー', 'モスクワ', 'ヘルシンキ', 'オスロ'];
const CREW8 = [], CTAG = [];
for (let i = 0; i < 8; i++) {
  const front = i < 4, x = front ? 60 - 1.8 + i * 1.2 : 60 - 1.2 + (i - 4) * 1.2, z = front ? 0.9 : -0.7;
  const p = makePerson({ ...CREW, skin: ['#efcfae', '#e8b98f', '#f1c9a5', '#d9a57c'][i % 4], hair: ['#1d1a19', '#2c2421', '#4a3426', '#1a1a22', '#6b4a33'][i % 5], long: i === 0 || i === 3 });
  p.position.set(x, 0, z); qs.add(p); CREW8.push(p);
  const t = tag(CITY[i], { size: 72, w: Math.max(240, 60 + CITY[i].length * 76), sx: Math.max(0.9, (60 + CITY[i].length * 76) / 300) }); t.position.set(x, front ? 2.4 : 2.75, z); qs.add(t); CTAG.push(t);
}
const tSecret = tag('本名は秘密', { size: 80, bg: '#e2483c' }); tSecret.position.set(60, 4.3, 0); qs.add(tSecret);

// ---------- 5. 外の警察の交渉テント（x=80） ----------
const tent = new THREE.Group(); tent.position.set(80, 0, -1); qs.add(tent);
{ const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.2, 4), mat('#e9edf2')); roof.rotation.y = Math.PI / 4; roof.position.y = 3.0; tent.add(roof);
  for (const [x, z] of [[-2.1, -2.1], [2.1, -2.1], [-2.1, 2.1], [2.1, 2.1]]) { const p = box(0.08, 2.4, 0.08, mat('#bfc5cc')); p.position.set(x, 1.2, z); tent.add(p); }
  const tb = box(2.6, 0.8, 1.2, mat('#5a6070')); tb.position.set(0, 0.4, -0.6); tent.add(tb);
  for (let i = 0; i < 3; i++) { const sc = box(0.7, 0.45, 0.06, mat('#1b2433')); sc.position.set(-0.8 + i * 0.8, 1.05, -0.9); tent.add(sc); const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.36), new THREE.MeshBasicMaterial({ color: ['#6fb3ff', '#9cffb0', '#ffd27a'][i] })); gl.position.set(-0.8 + i * 0.8, 1.05, -0.86); tent.add(gl); }
}
const nego = makePerson({ skin: '#f5d3b5', hair: '#6b4a33', shirt: '#7a2f3a', pants: '#2b3346', long: true }); nego.position.set(80, 0, 0.4); nego.rotation.y = Math.PI - 0.2; nego.userData.arms[1].rotation.x = -2.5; qs.add(nego);
const tNego = tag('交渉人', { size: 80 }); tNego.position.set(80, 2.6, 0.4); qs.add(tNego);
const CARS5 = [[76.4, 1.5, 0.6], [83.8, 1.2, -0.5]].map(([x, z, r]) => { const c = policeCar(); c.position.set(x, 0, z); c.rotation.y = r; qs.add(c); return c; });
const COPS5 = [[77.8, 2.4], [82.2, 2.6]].map(([x, z]) => { const p = makePerson(POLICE); cap(p); p.position.set(x, 0, z); p.rotation.y = Math.PI; qs.add(p); return p; });
const tAhead = tag('教授はその先を読む', { size: 70, bg: '#e6b450', color: '#14161c' }); tAhead.position.set(80, 4.3, -1); qs.add(tAhead);

// ---------- shots ----------
const ALLTAG = [tProf, tOut, tHost, tSecret, tNego, tAhead, ...CTAG];
function base() { S.reset(); ALLTAG.forEach(x => x.visible = false); [...CARS1, ...CARS5].forEach(c => { c.children.forEach(o => { if (o.isPointLight) o.intensity = 0; }); }); }

function shotMint(t, T) { // 0〜9：造幣局をパトカーが囲む（0秒目がサムネ）
  base(); S.aim(0, -2); lift(170);
  S.hemi.intensity = 0.95; S.darken(0.3);
  CARS1.forEach((c, i) => c.userData.lights(T + i * 0.08));
  if (T > 5.7) setTop('狙う金額', '24億ユーロ', clamp((T - 5.7) / 0.2), '#e6b450');
  const u = ease(T / 9);
  look(lerp(6.5, 4.5, u), lerp(4.2, 3.6, u), lerp(15.5, 13, u), 0, 3.2, -4, 50);
  return qs;
}
function shotDen(t) { // 9〜17：教授と呼ばれる男
  base(); S.aim(20, 0); lift(220);
  S.hemi.intensity = 0.75; S.key.intensity = 0.8;
  tProf.userData.pop((t - 0.6) / 0.35);
  if (t > 4.2) { tProf.visible = false; tOut.userData.pop((t - 4.3) / 0.35); }
  const u = ease(t / 8);
  look(lerp(22.2, 21.6, u), lerp(2.8, 2.4, u), lerp(5.6, 4.4, u), 19.9, 1.8, -1.3, 52);
  return qs;
}
function shotPress(t) { // 17〜25：お金を自分たちで刷る。人質
  base(); S.aim(40, -1); lift(200);
  PRESS.forEach(rs => rs.forEach((r, k) => { r.rotation.y = t * (k % 2 ? 6 : -6); }));
  const n = Math.floor(lerp(2, 14, easeOut(t / 4)));
  STACKS.forEach((L, i) => L.forEach((b, k) => { b.visible = k < n - (i % 2); }));
  tHost.userData.pop((t - 4.3) / 0.35);
  const k = ease((t - 3.4) / 1.6);
  look(lerp(38.5, 40.6, k), lerp(3.6, 3.0, k), lerp(6.2, 4.4, k), lerp(39.5, 43.6, k), lerp(1.2, 1.5, k), lerp(-0.8, -3.2, k), 52);
  return qs;
}
function shotCrew(t) { // 25〜33：8人の名前は都市の名前
  base(); S.aim(60, 0); lift(200);
  CTAG.forEach((x, i) => x.userData.pop((t - (0.9 + i * 0.32)) / 0.3));
  if (t > 4.1) tSecret.userData.pop((t - 4.2) / 0.35);
  const u = ease(t / 8);
  look(lerp(59.2, 60.4, u), lerp(3.9, 3.6, u), lerp(11.6, 10.8, u), 60.1, 1.9, 0, 50);
  return qs;
}
function shotPolice(t) { // 33〜42：外では警察が交渉。教授はその先を読む
  base(); S.aim(80, 0); lift(220);
  S.hemi.intensity = 0.95; S.darken(0.3);
  CARS5.forEach((c, i) => c.userData.lights(t + i * 0.08));
  tNego.userData.pop((t - 0.8) / 0.35);
  if (t > 4.3) { tNego.visible = false; tAhead.userData.pop((t - 4.4) / 0.35); }
  const u = ease(t / 9);
  look(lerp(84.5, 82, u), lerp(3.4, 3.0, u), lerp(9.5, 8.0, u), 80, 1.9, -0.6, 52);
  return qs;
}
const DARK = '#05060a';
function turnIn(k) { CREW8.forEach((p, i) => { const tx = 60, dir = Math.atan2(tx - p.position.x, 1.5 - p.position.z); p.rotation.y = lerp(0, dir * 0.6, k); }); }
function shotTwist(t) { // 42〜49：照明が落ちて、ひとりが赤く照らされる
  base(); S.aim(60, 0); lift(190);
  const d = ease(t / 1.3);
  S.hemi.intensity = lerp(1.25, 0.1, d); S.key.intensity = lerp(1.5, 0, d); S.darken(d, DARK);
  const who = CREW8[1];
  S.spot.angle = 0.16; S.spot.position.set(who.position.x, 5.6, who.position.z + 1.2); S.spot.target.position.set(who.position.x, 1.2, who.position.z);
  S.spot.intensity = lerp(0, 70, ease((t - 0.8) / 1.0));
  turnIn(ease((t - 1.4) / 1.4));
  const k = ease(t / 6.5);
  look(lerp(60.6, who.position.x + 0.2, k), lerp(3.6, 2.1, k), lerp(10.2, 4.2, k), lerp(60, who.position.x, k), lerp(1.9, 1.75, k), lerp(-0.6, who.position.z, k), lerp(50, 42, k));
  return qs;
}
function shotQuiz(t) { // 49〜56：このドラマわかった？
  base(); S.aim(60, 0); lift(190);
  S.hemi.intensity = 0.1; S.key.intensity = 0; S.darken(1, DARK);
  const who = CREW8[1];
  S.spot.angle = 0.16; S.spot.position.set(who.position.x, 5.6, who.position.z + 1.2); S.spot.target.position.set(who.position.x, 1.2, who.position.z); S.spot.intensity = 70;
  turnIn(1);
  const k = ease(t / 7);
  look(lerp(who.position.x + 0.2, 60, k), lerp(2.1, 9.5, k), lerp(4.2, 10.5, k), lerp(who.position.x, 60, k), lerp(1.75, 0.6, k), lerp(who.position.z, -0.4, k), lerp(42, 50, k));
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotMint(t, T) },
  { a: 9, b: 17, f: shotDen },
  { a: 17, b: 25, f: shotPress },
  { a: 25, b: 33, f: shotCrew },
  { a: 33, b: 42, f: shotPolice },
  { a: 42, b: 49, f: shotTwist },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, '国の造幣局に、<br>強盗団が立てこもった。'],
  [5.6, 9.0, '狙いは、<br>24億ユーロ。'],
  [9.2, 13.2, '計画を立てたのは、<br>教授と呼ばれる男。'],
  [13.2, 17.0, 'でも本人は、<br>中に入らない。'],
  [17.2, 21.0, 'お金は盗まない。<br>自分たちで刷る。'],
  [21.0, 25.0, '人質をとって、<br>何日も立てこもる。'],
  [25.2, 29.0, 'メンバー8人の名前は、<br>全部、都市の名前。'],
  [29.0, 33.0, 'お互いの本名は、<br>知らない。'],
  [33.2, 37.4, '外では警察が、<br>交渉を仕掛ける。'],
  [37.4, 41.8, 'でも教授の計画は、<br>その先を読んでいる。'],
  [42.2, 45.2, '完璧な計画を、<br>狂わせるのは'],
  [45.2, 49.0, '警察じゃなかった。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'わかった人は、<br>コメントで答えて。'],
  [56.4, 59.6, '答えは、<br>ペーパー・ハウス。'],
  [59.6, 63.6, '観た人は感想を、<br>まだの人は保存して。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotDen || f === shotPress || f === shotCrew,
  meta: {
    id: 'q003', v2: true,
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 303,
    hits: [5.8, 17.2, 56.4], risers: [52.0],
    impacts: [0.3, 5.8, 56.4],
    sfx: [[0.2, 'alarm'], [9.0, 'whoosh'], [17.0, 'whoosh'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.2, 'drone'], [49.0, 'meter', 0.5]],
    narr: { '24億ユーロ': 'にじゅうよんおくユーロ', '造幣局': 'ぞうへいきょく', '教授': 'きょうじゅ', '8人': 'はちにん', '本名': 'ほんみょう' },
    caption: 'このドラマのタイトル、わかる？\n国の造幣局に強盗団が立てこもった。狙いは24億ユーロ。計画を立てたのは教授と呼ばれる男。メンバー8人の名前は全部、都市の名前。\n\n答えは動画の最後で。わかった人はコメントで答えて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '海外ドラマ', 'どんでん返し'],
  },
});
applyQuizCards({ answer: 'ペーパー・ハウス', info: 'Netflix｜スペイン・パート1〜5', answerSize: 104 });
