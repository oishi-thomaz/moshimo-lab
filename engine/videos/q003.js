import * as THREE from 'three';
import { clamp, lerp, ease, easeOut, mat, box, canvasTex, makePerson, rng } from '../lib.js';
import { lift, look, runStory, endCard, setTop } from '../story.js';
import { quizStage, tag, countdown, applyQuizCards } from './quiz-kit.js';

// タイトル当てクイズ #003 ペーパー・ハウス（ドラマ・スペイン・パート1〜5。Netflixで見放題、2026/10確認）
// 設定：「教授」と呼ばれる男が犯罪者8人を集め、造幣局に立てこもって24億ユーロを刷る（ciatr 作品紹介）
// 追加で確かめた事実（2026/11/2）：
//   ・8人組の強盗団が67人の人質を取り、マドリードの造幣局に立てこもる。教授は現場には赴かず、離れた場所から指示を出す（ja.wikipedia.org/wiki/ペーパー・ハウス）
//   ・人質には造幣局の局長や職員がいる。強盗犯と警察の頭脳戦が繰り広げられるクライムサスペンス（ciatr.jp/topics/320569）
//   ・8人のコードネームは都市の名前（トーキョー・モスクワ・ベルリン・ナイロビ・リオ・デンバー・ヘルシンキ・オスロ）。舞台はマドリードのスペイン王立造幣局（en.wikipedia.org/wiki/Money_Heist）
//   ・メンバーはお互いの素性を明かさない（cheatsheet.com の Money Heist Korea の記事・本家のルールの説明）
// 構成（ヒント6段）：1 職場の出口がふさがれる → 2 仕組んだ男は現場に入らない → 3 警察の包囲と67人の人質 → 4 素性を隠した8人、お金を自分たちで刷る
//                  → 5 スペインの造幣局・24億ユーロ・頭脳戦 → 6 決め手：男の呼び名は教授、仲間は全員都市の名前
// 教授・都市の名前は6段目まで字幕にも札にも出さない。建物に看板の文字は付けない。結末と計画の行方には触れない
// 作品の映像・衣装・仮面・ロゴ・有名な場面の構図（お札が舞う場面など）は使わず、設定だけを汎用の3Dで見せる。メンバーの服は作品とちがう色（紺の作業着）にする。人が傷つく描写は出さない

const S = quizStage({ bg: '#18202c', floor: '#2a3140', fogNear: 26, fogFar: 80 });
const qs = S.scene;
const R = rng(303);

const CREW = { skin: '#efcfae', hair: '#1d1a19', shirt: '#2f3b4f', pants: '#2f3b4f' };
const OFFICE = (i) => ({ skin: ['#efcfae', '#e8b98f', '#f5d3b5', '#d9a57c'][i % 4], hair: ['#2c2421', '#4a3426', '#9a9a9a', '#1a1a22'][i % 4], shirt: ['#e9e4da', '#4fa3d1', '#c94f7c', '#59606e', '#f2c14e', '#5d8c3a'][i % 6], pants: ['#2b3346', '#3b3f4a', '#5a4a3a'][i % 3], long: i % 2 === 1, skirt: i % 4 === 1 });
const POLICE = { skin: '#efcfae', hair: '#1d1a19', shirt: '#24324f', pants: '#1c2232' };
function cap(p, color = '#1c2232') { const h = p.userData.head; const c = box(0.44, 0.14, 0.44, mat(color)); c.position.y = 0.52; h.add(c); const v = box(0.4, 0.03, 0.18, mat(color)); v.position.set(0, 0.46, 0.27); h.add(v); }
const crewLook = (i) => ({ ...CREW, skin: ['#efcfae', '#e8b98f', '#f1c9a5', '#d9a57c'][i % 4], hair: ['#1d1a19', '#2c2421', '#4a3426', '#1a1a22', '#6b4a33'][i % 5], long: i === 0 || i === 3 });

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
  g.userData.lights = (t, k = 6) => { const on = Math.floor(t * 6) % 2 === 0; rM.color.set(on ? '#ff2a2a' : '#3a0a0a'); bM.color.set(on ? '#0c1a40' : '#2a5bff'); pl.color.set(on ? 0xff2a2a : 0x2a5bff); pl.intensity = k; };
  g.userData.off = () => { pl.intensity = 0; };
  return g;
}

// ---------- 1段目. 職場のホール（x=100）。0秒目がサムネ ----------
const HALL = new THREE.Group(); HALL.position.set(100, 0, 0); qs.add(HALL);
const ALARMS = [], ALARM_L = [];
let SHUTTER, SHUT_T;
{ const fl = box(14, 0.06, 12, mat('#bdb5a4')); fl.position.set(0, 0.03, 0); HALL.add(fl);
  for (let i = 0; i < 6; i++) { const ln = box(0.03, 0.065, 12, mat('#a8a090')); ln.position.set(-5 + i * 2, 0.035, 0); HALL.add(ln); }
  const wall = box(14, 6.4, 0.3, mat('#d9d0bd')); wall.position.set(0, 3.2, -4.2); HALL.add(wall);
  for (const x of [-3.3, -1.9, 1.9, 3.3]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 5.0, 16), mat('#e8e0cf')); c.position.set(x, 2.5, -3.75); c.castShadow = true; HALL.add(c); }
  const beam = box(9, 0.5, 0.5, mat('#e8e0cf')); beam.position.set(0, 5.2, -3.75); HALL.add(beam);
  // 奥の出入口と、下りてくるシャッター（文字なし）
  const hole = box(2.6, 3.0, 0.05, new THREE.MeshBasicMaterial({ color: '#cfe0ee' })); hole.position.set(0, 1.5, -4.02); HALL.add(hole);
  const frame = box(2.9, 0.3, 0.2, mat('#6c727c')); frame.position.set(0, 3.12, -3.98); HALL.add(frame);
  SHUT_T = canvasTex(64, 32, (g, w, h) => { g.fillStyle = '#8f96a0'; g.fillRect(0, 0, w, h); g.fillStyle = '#6a717c'; g.fillRect(0, h - 6, w, 6); g.fillStyle = '#b3bac4'; g.fillRect(0, 0, w, 3); });
  SHUT_T.wrapS = SHUT_T.wrapT = THREE.RepeatWrapping;
  const sg = new THREE.PlaneGeometry(2.6, 3.0); sg.translate(0, -1.5, 0);
  SHUTTER = new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ map: SHUT_T })); SHUTTER.position.set(0, 3.0, -3.96); HALL.add(SHUTTER);
  // 赤い警報ランプ（左右）
  for (const x of [-2.5, 2.5]) { const base = box(0.4, 0.12, 0.2, mat('#3a3a3a')); base.position.set(x, 3.9, -4.0); HALL.add(base); const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.36, 16), new THREE.MeshBasicMaterial({ color: '#ff2a2a', fog: false })); dome.position.set(x, 4.12, -3.9); HALL.add(dome); ALARMS.push(dome); const l = new THREE.PointLight(0xff3020, 0, 11, 1.2); l.position.set(x, 3.6, -3.2); HALL.add(l); ALARM_L.push(l); }
  // 受付の机
  const desk = box(2.2, 1.0, 0.7, mat('#7a5a40')); desk.position.set(-4.2, 0.5, -1.4); HALL.add(desk);
}
const WORK = [[-1.5, 0.4, 2.6], [-0.6, -0.9, 3.1], [0.5, -0.5, -3.0], [1.6, 0.2, -2.5], [-1.0, 1.7, 0.5], [0.7, 2.0, -0.4], [2.1, 1.4, -0.9], [-2.2, 1.2, 1.0]].map(([x, z, r], i) => { const p = makePerson(OFFICE(i)); p.position.set(100 + x, 0, z); p.rotation.y = r; p.userData.r = r; qs.add(p); return p; });
const tLock = tag('出られない', { size: 84, bg: '#e2483c' }); tLock.position.set(100, 3.75, -3.4); qs.add(tLock);

// ---------- 2段目. 男の隠れ家（x=20） ----------
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
  const lampL = new THREE.PointLight(0xffd59a, 4, 6, 1.4); lampL.position.set(1.2, 1.9, -1.4); den.add(lampL);
  const lampS = box(0.3, 0.2, 0.3, mat('#2d6b45')); lampS.position.set(1.4, 1.5, -1.7); den.add(lampS);
  // 机の上のモニター（建物の見取り図が光る）
  const mon = box(0.8, 0.5, 0.06, mat('#1b2433')); mon.position.set(1.0, 1.25, -1.9); den.add(mon);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), new THREE.MeshBasicMaterial({ color: '#6fb3ff' })); gl.position.set(1.0, 1.25, -1.865); den.add(gl);
}
const man = makePerson({ skin: '#efcfae', hair: '#2c2421', shirt: '#5c5145', pants: '#22262f' }); man.position.set(19.6, 0, -0.6); man.rotation.y = 0.35; qs.add(man);
const tMan = tag('仕組んだ男', { size: 80, bg: '#e6b450', color: '#14161c' }); tMan.position.set(19.6, 2.6, -0.6); qs.add(tMan);
const tOut = tag('現場には行かない', { size: 70, w: 560, bg: '#e2483c' }); tOut.position.set(20.1, 2.65, -0.6); qs.add(tOut);

// ---------- 3段目・5段目・クイズ. 石造りの建物（x=0）。看板の文字は付けない ----------
const MINT = new THREE.Group(); MINT.position.set(0, 0, -5); qs.add(MINT);
const MWIN = [];
let FLAG;
{ const stone = mat('#cfc6b4'), dark = mat('#8a8272');
  const main = box(11, 4.4, 3.4, stone); main.position.y = 2.2 + 0.6; MINT.add(main);
  for (let i = 0; i < 3; i++) { const st = box(8 - i * 0.6, 0.2, 1.2 - i * 0.3, dark); st.position.set(0, 0.1 + i * 0.2, 2.2 - i * 0.3); MINT.add(st); }
  const base = box(11.4, 0.6, 3.8, dark); base.position.y = 0.3; MINT.add(base);
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 3.6, 16), stone); c.position.set(-3.75 + i * 1.5, 2.4, 1.95); c.castShadow = true; MINT.add(c); }
  const lint = box(8.6, 0.5, 0.6, stone); lint.position.set(0, 4.45, 1.95); MINT.add(lint);
  const tri = new THREE.Shape(); tri.moveTo(-4.4, 0); tri.lineTo(4.4, 0); tri.lineTo(0, 1.3); tri.lineTo(-4.4, 0);
  const pedM = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.5, bevelEnabled: false }), stone); pedM.position.set(0, 4.7, 1.7); MINT.add(pedM);
  const door = box(1.4, 2.4, 0.1, mat('#3a2e22')); door.position.set(0, 1.9, 1.72); MINT.add(door);
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), new THREE.MeshBasicMaterial({ color: '#2a3242' })); w.position.set(-3.75 + (i < 2 ? i : i + 2) * 1.5 + 0.75, 2.6, 1.72); MINT.add(w); MWIN.push(w); }
  // 屋根の旗（赤・黄・赤の3本線だけ。紋章なし）。5段目でだけ出す
  FLAG = new THREE.Group(); FLAG.position.set(0, 6.0, 1.95); MINT.add(FLAG);
  const pole = box(0.06, 2.4, 0.06, mat('#d8d8d8')); pole.position.y = 1.2; FLAG.add(pole);
  const flT = canvasTex(192, 128, (g, w, h) => { g.fillStyle = '#c8202a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4c21a'; g.fillRect(0, h / 4, w, h / 2); });
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0, 8, 1), new THREE.MeshLambertMaterial({ map: flT, side: THREE.DoubleSide })); flag.position.set(0.78, 1.9, 0); FLAG.add(flag); FLAG.userData.flag = flag;
}
const CARS = [[-3.4, 2.6, 0.5], [3.6, 2.2, -0.4], [0.4, 4.6, 0.1], [-5.8, 0.6, 1.2], [6.0, 0.4, -1.1]].map(([x, z, r]) => { const c = policeCar(); c.position.set(x, 0, z); c.rotation.y = r; qs.add(c); return c; });
const COPS = [[-1.8, 3.4], [1.9, 3.6], [-0.2, 3.0], [-4.4, 2.0], [4.6, 1.6]].map(([x, z]) => { const p = makePerson(POLICE); cap(p); p.position.set(x, 0, z); p.rotation.y = Math.PI; qs.add(p); return p; });
const tHost = tag('人質67人', { size: 84, bg: '#e2483c' }); tHost.position.set(0, 4.0, -2.4); qs.add(tHost);
const tSpain = tag('スペイン', { size: 84, w: 400, bg: '#e6b450', color: '#14161c' }); tSpain.position.set(-1.1, 7.6, -3.0); qs.add(tSpain);

// ---------- 4段目. 印刷室（x=40）。8人が自分たちでお札を刷る ----------
const room3 = new THREE.Group(); room3.position.set(40, 0, 0); qs.add(room3);
{ const back = box(12, 5, 0.2, mat('#7d8578')); back.position.set(0, 2.5, -4.5); room3.add(back);
  const fl = box(12, 0.05, 9, mat('#5a6058')); fl.position.set(0, 0.025, -0.5); room3.add(fl);
  for (let i = 0; i < 3; i++) { const lamp = new THREE.PointLight(0xfff0d0, 3, 7, 1.3); lamp.position.set(-3.2 + i * 3.2, 3.6, 0); room3.add(lamp); } }
const PRESS = [], STACKS = [];
const billT = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#b9c9a6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6e8a5c'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20); g.fillStyle = '#8aa074'; g.beginPath(); g.arc(w / 2, h / 2, 30, 0, Math.PI * 2); g.fill(); });
const billTop = new THREE.MeshLambertMaterial({ map: billT }), billSide = mat('#d8e2c6');
for (let i = 0; i < 3; i++) {
  const x = -2.5 + i * 2.5;
  const m = new THREE.Group(); m.position.set(x, 0, -2.2); room3.add(m);
  const bodyP = box(2.0, 1.4, 1.4, mat('#4a5568')); bodyP.position.y = 0.7; m.add(bodyP);
  bodyP.scale.x = 0.9;
  const top = box(1.6, 0.4, 1.2, mat('#2f3846')); top.position.y = 1.6; m.add(top);
  const rolls = []; for (let k = 0; k < 3; k++) { const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.3, 14), mat('#9aa3ae')); rl.rotation.x = Math.PI / 2; rl.position.set(-0.6 + k * 0.6, 1.95, 0); m.add(rl); rolls.push(rl); }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: '#7dff9a' })); lamp.position.set(0.8, 1.5, 0.71); m.add(lamp);
  PRESS.push(rolls);
  const st = new THREE.Group(); st.position.set(x * 0.72, 0, 1.55); room3.add(st);
  const layers = []; for (let k = 0; k < 10; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.45), [billSide, billSide, billTop, billSide, billSide, billSide]); b.position.set((k % 2) * 0.05 - 0.02, 0.06 + k * 0.12, 0); b.rotation.y = (k % 3) * 0.03; b.castShadow = true; st.add(b); layers.push(b); }
  STACKS.push(layers);
}
const PCREW = [[-2.8, -0.3, 0.4], [-2.0, 0.45, 0.25], [-1.15, -0.35, 0.15], [-0.35, 0.45, 0.05], [0.45, -0.3, -0.05], [1.25, 0.45, -0.15], [2.05, -0.35, -0.25], [2.85, 0.4, -0.4]].map(([x, z, r], i) => { const p = makePerson(crewLook(i)); p.position.set(40 + x, 0, z); p.rotation.y = r; qs.add(p); return p; });
const tEight = tag('素性を隠した8人', { size: 66, w: 560, bg: '#14161c' }); tEight.position.set(40, 3.2, 0.9); qs.add(tEight);
const tPrint = tag('自分たちで刷る', { size: 70, w: 520, bg: '#e2483c' }); tPrint.position.set(40, 3.2, 0.9); qs.add(tPrint);

// ---------- 6段目（決め手）. 8人の呼び名は都市の名前（x=60） ----------
const vault = new THREE.Group(); vault.position.set(60, 0, 0); qs.add(vault);
{ const back = box(14, 5, 0.2, mat('#5a6070')); back.position.set(0, 2.5, -3.2); vault.add(back);
  const door = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.4, 32), mat('#9aa3ae')); door.rotation.x = Math.PI / 2; door.position.set(0, 2.2, -3.0); vault.add(door);
  for (let k = 0; k < 6; k++) { const sp = box(0.12, 1.2, 0.12, mat('#6c7480')); sp.position.set(0, 2.2, -2.75); sp.rotation.z = k * Math.PI / 6; vault.add(sp); } }
const CITY = ['トーキョー', 'ベルリン', 'リオ', 'ナイロビ', 'デンバー', 'モスクワ', 'ヘルシンキ', 'オスロ'];
const CREW8 = [], CTAG = [];
for (let i = 0; i < 8; i++) {
  const order = [0, 4, 1, 5, 2, 6, 3, 7][i], hi = order % 2 === 1, x = 60 - 2.24 + order * 0.64, z = hi ? 0.1 : 0.5;
  const p = makePerson(crewLook(i)); p.position.set(x, 0, z); qs.add(p); CREW8.push(p);
  const n = CITY[i].length, w = Math.max(240, 60 + n * 60);
  const t = tag(CITY[i], { size: n > 4 ? 52 : 62, w, sx: w / 300 }); t.position.set(x, hi ? 2.95 : 2.3, z); qs.add(t); CTAG.push(t);
}
const tProf = tag('指示役の呼び名は、教授', { size: 62, w: 760, bg: '#e6b450', color: '#14161c' }); tProf.position.set(60, 4.05, 0); qs.add(tProf);

// ---------- shots ----------
const ALLTAG = [tLock, tMan, tOut, tHost, tSpain, tEight, tPrint, tProf, ...CTAG];
function base() { S.reset(); ALLTAG.forEach(x => x.visible = false); CARS.forEach(c => c.userData.off()); ALARM_L.forEach(l => l.intensity = 0); FLAG.visible = false; MWIN.forEach(w => w.material.color.set('#2a3242')); }

function shotHall(t, T) { // 1段目 0〜9：いつもの職場。警報が鳴り、出口のシャッターが下りてくる（0秒目がサムネ）
  base(); S.aim(100, -1); lift(40);
  S.hemi.intensity = 1.0; S.key.intensity = 0.9;
  const pulse = 0.5 + 0.5 * Math.sin(T * 9);
  WORK.forEach((p, i) => { if (i >= 4) p.userData.head.rotation.x = 0.08; });
  ALARMS.forEach(d => d.material.color.set(pulse > 0.5 ? '#ff3a2a' : '#a01818'));
  ALARM_L.forEach(l => l.intensity = 4 + 14 * pulse);
  const k = clamp(0.42 + 0.58 * ease((T - 0.6) / 5.6)); // 0秒目からもう半分下りている
  SHUTTER.scale.y = k; SHUT_T.repeat.set(1, 12 * k); SHUTTER.position.y = 3.0;
  WORK.forEach((p, i) => { const look2 = T < 2.2 ? 0 : Math.sin(T * 1.6 + i * 1.7) * 0.5; p.rotation.y = p.userData.r; p.userData.head.rotation.y = look2; });
  tLock.userData.pop((T - 6.5) / 0.35);
  const u = ease(T / 9);
  look(lerp(101.2, 100.6, u), lerp(2.4, 2.2, u), lerp(9.4, 8.0, u), 100, 2.0, -1.6, 52);
  return qs;
}
function shotDen(t) { // 2段目 9〜17：仕組んだのはひとりの男。本人は現場に入らない
  base(); S.aim(20, 0); lift(220);
  S.hemi.intensity = 0.75; S.key.intensity = 0.8;
  man.userData.arms[1].rotation.x = -2.0; man.userData.arms[1].rotation.z = 0.55; man.userData.head.rotation.y = 0.5 * ease((t - 0.3) / 0.8) * (t < 4.2 ? 1 : 0.4); // 壁の計画図を指す
  tMan.userData.pop((t - 0.6) / 0.35);
  if (t > 4.2) { tMan.visible = false; tOut.userData.pop((t - 4.3) / 0.35); }
  const u = ease(t / 8);
  look(lerp(22.2, 21.6, u), lerp(2.8, 2.4, u), lerp(5.6, 4.4, u), 19.9, 1.8, -1.3, 52);
  return qs;
}
function shotSiege(t, T) { // 3段目 17〜25：夜。石造りの建物を警察が囲む。中には人質
  base(); S.aim(0, -2); lift(170);
  S.hemi.intensity = 0.65; S.key.intensity = 0.35; S.darken(0.6, '#05070e');
  CARS.forEach((c, i) => c.userData.lights(T + i * 0.08, 7));
  MWIN.forEach(w => w.material.color.set('#e8c47a'));
  tHost.userData.pop((t - 4.0) / 0.35);
  const u = ease(t / 8);
  look(lerp(-5.0, -2.0, u), lerp(1.6, 2.4, u), lerp(10.5, 12.0, u), 0, 2.6, -3.5, 54);
  return qs;
}
function shotPress(t) { // 4段目 25〜33：素性を隠した8人。狙いは、お金を自分たちで刷ること
  base(); S.aim(40, -1); lift(170);
  S.hemi.intensity = 0.95;
  PRESS.forEach(rs => rs.forEach((r, k) => { r.rotation.y = t * (k % 2 ? 6 : -6); }));
  const n = t < 3.6 ? 3 : Math.floor(lerp(3, 10, easeOut((t - 3.6) / 2.6)));
  STACKS.forEach((L, i) => L.forEach((b, k) => { b.visible = k < n - (i % 2); }));
  PCREW.forEach((p, i) => { p.userData.arms.forEach((a, j) => { a.rotation.x = -0.6 - 0.25 * Math.sin(t * 5 + i + j); }); });
  tEight.userData.pop((t - 0.7) / 0.35);
  if (t > 3.8) { tEight.visible = false; tPrint.userData.pop((t - 3.9) / 0.35); }
  const u = ease(t / 8);
  look(lerp(40.5, 40.1, u), lerp(4.4, 4.0, u), lerp(11.6, 10.6, u), 40, 1.3, -0.2, 54);
  return qs;
}
function shotSpain(t, T) { // 5段目 33〜42：昼。舞台はスペインの国の造幣局。24億ユーロ
  base(); S.aim(0, -2); lift(150);
  S.hemi.intensity = 1.2; S.key.intensity = 1.6; S.scene.background.set('#9cc0e0'); S.scene.fog.color.set('#9cc0e0');
  FLAG.visible = true; const fp = FLAG.userData.flag.geometry.attributes.position; for (let i = 0; i < fp.count; i++) { const x = fp.getX(i); fp.setZ(i, Math.sin(x * 3 + T * 5) * 0.08 * (x + 0.75)); } fp.needsUpdate = true;
  CARS.forEach((c, i) => c.userData.lights(T + i * 0.08, 3));
  tSpain.userData.pop((t - 0.8) / 0.35);
  if (t > 4.3) setTop('狙う金額', '24億ユーロ', clamp((t - 4.3) / 0.2), '#e6b450');
  const u = ease(t / 9);
  look(lerp(5.0, 3.2, u), lerp(4.6, 4.2, u), lerp(14.5, 16.5, u), 0, 4.2, -4, 52);
  return qs;
}
function shotNames(t) { // 6段目 42〜49（決め手）：指示役は教授。8人の呼び名は全部、都市の名前
  base(); S.aim(60, 0); lift(200);
  S.hemi.intensity = 1.0;
  CTAG.forEach((x, i) => x.userData.pop((t - (0.6 + i * 0.3)) / 0.3));
  tProf.userData.pop((t - 3.6) / 0.35);
  const u = ease(t / 7);
  look(lerp(59.8, 60.2, u), lerp(3.9, 3.6, u), lerp(13.4, 12.6, u), 60, 2.2, 0, 50);
  return qs;
}
function shotQuiz(t, T) { // 49〜56：このドラマわかった？（夜の建物と、包囲するパトカー）
  base(); S.aim(0, -2); lift(170);
  S.hemi.intensity = 0.45; S.key.intensity = 0.2; S.darken(0.8, '#05070e');
  CARS.forEach((c, i) => c.userData.lights(T + i * 0.08, 7));
  MWIN.forEach(w => w.material.color.set('#e8c47a'));
  const k = ease(t / 7);
  look(lerp(1.5, 0, k), lerp(2.6, 6.5, k), lerp(11.5, 17.5, k), 0, lerp(2.6, 2.4, k), -3.5, 54);
  countdown(t);
  return qs;
}

const SHOTS = [
  { a: 0, b: 9, f: (t, T) => shotHall(t, T) },
  { a: 9, b: 17, f: shotDen },
  { a: 17, b: 25, f: shotSiege },
  { a: 25, b: 33, f: shotPress },
  { a: 33, b: 42, f: shotSpain },
  { a: 42, b: 49, f: shotNames },
  { a: 49, b: 56, f: shotQuiz },
  { a: 56, b: 64, f: endCard },
];
const SUBS = [
  [2.5, 5.6, 'いつもどおり、<br>職場で働いていたら'],
  [5.6, 9.0, '突然、出口が<br>すべてふさがれた。'],
  [9.2, 13.2, '仕組んだのは、<br>ひとりの男。'],
  [13.2, 17.0, '本人は現場に入らず、<br>外から指示を出す。'],
  [17.2, 21.0, '建物のまわりは、<br>警察が完全に包囲。'],
  [21.0, 25.0, '中に残されたのは、<br>67人の人質。'],
  [25.2, 29.0, '立てこもったのは、<br>素性を隠した8人。'],
  [29.0, 33.0, '狙いは、お金を<br>自分たちで刷ること。'],
  [33.2, 37.4, '舞台はスペイン。<br>国の造幣局。'],
  [37.4, 41.8, '刷る金額は24億ユーロ。<br>警察との頭脳戦。'],
  [42.2, 45.6, '男の呼び名は、教授。<br>仲間は全員、都市の名前。'],
  [45.6, 49.0, 'トーキョー、ベルリン、リオ。<br>完璧な計画が動き出す。'],
  [49.2, 52.0, 'このドラマ、<br>わかった？'],
  [52.0, 55.8, 'カウントダウンの間に、<br>当ててみて。'],
  [56.4, 59.6, '答えは、<br>ペーパー・ハウス。'],
  [59.6, 63.6, '何秒で、どこでわかった？<br>感想も聞かせて。'],
];

runStory({
  shots: SHOTS, subs: SUBS, duration: 64,
  dim: (f) => f === shotDen || f === shotPress || f === shotNames,
  meta: {
    id: 'q003', v2: true, answer: 'ペーパー・ハウス',
    title: 'このドラマのタイトルは？',
    titleHtml: 'このドラマの<br>タイトルは？',
    mood: 'tension', seed: 303,
    hits: [6.4, 21.0, 29.0, 42.2, 56.4], risers: [37.4, 52.0],
    impacts: [0.3, 6.4, 21.0, 29.0, 42.2, 56.4],
    sfx: [[0.2, 'alarm'], [6.3, 'poof'], [9.0, 'whoosh'], [17.0, 'drone'], [25.0, 'whoosh'], [33.0, 'whoosh'], [42.0, 'whoosh'], [49.0, 'meter', 0.5]],
    narr: { '24億ユーロ': 'にじゅうよんおくユーロ', '刷ること': 'すること', '刷る金額': 'するきんがく', '67人': 'ろくじゅうななにん', '8人': 'はちにん', '仕組んだ': 'しくんだ', '働いて': 'はたらいて', '職場': 'しょくば', '突然': 'とつぜん', '出口': 'でぐち', '本人': 'ほんにん', '現場': 'げんば', '指示': 'しじ', '建物': 'たてもの', '警察': 'けいさつ', '完全': 'かんぜん', '包囲': 'ほうい', '残された': 'のこされた', '人質': 'ひとじち', '立てこもった': 'たてこもった', '素性': 'すじょう', '隠した': 'かくした', '狙い': 'ねらい', '舞台': 'ぶたい', '造幣局': 'ぞうへいきょく', '頭脳戦': 'ずのうせん', '呼び名': 'よびな', '教授': 'きょうじゅ', '仲間': 'なかま', '全員': 'ぜんいん', '都市': 'とし', '完璧': 'かんぺき', '計画': 'けいかく', '動き出す': 'うごきだす', '国の': 'くにの', '男': 'おとこ', '答え': 'こたえ', '何秒': 'なんびょう', '感想': 'かんそう' },
    caption: 'このドラマのタイトル、わかる？\nいつもどおり職場で働いていたら、突然、出口がすべてふさがれた。仕組んだのは、ひとりの男。本人は現場に入らず、外から指示を出す。建物のまわりは、警察が完全に包囲している。\n\n答えは動画の最後で。何秒でわかった？どこでわかった？コメントで教えて。観た人は感想も聞かせて。',
    hashtags: ['タイトル当てクイズ', 'ネトフリ', 'Netflix', '海外ドラマ', 'どんでん返し'],
  },
});
applyQuizCards({ answer: 'ペーパー・ハウス', info: 'Netflix｜スペイン・パート1〜5', answerSize: 104 });
