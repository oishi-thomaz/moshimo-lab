import * as THREE from 'three';
import { clamp, lerp, ease, fade, mat, box, comma, makePerson, SKIN, HAIR } from '../lib.js';
import { room, setRoom, setLight } from './room.js';
import { town, setTownEnv } from './town.js';
import { stage, makeLabel, setStageColor } from './stage.js';
import { lift, look, runStory, endCard, hudTime, countUp, textSprite, setTop, setHud, el } from '../story.js';

// =====================================================
// WORKOUT 30日チャレンジの共通テンプレート（腕立て100回 0531 の型を、ほかの運動に広げる）
// kind: 'squat' | 'crunch'（リビング）／'walk' | 'run'（住宅街の歩道）
// 使い方：workoutVideo({ id, kind, subs, chips, ... })（下の cfg の説明を参照）
// 人：ひざが曲がる2段の脚（太もも＋すね）に作り替えた makePerson
// =====================================================

// ---------- person with knees ----------
function kneePerson(opt) {
  const p = makePerson(opt); p.rotation.order = 'YXZ';
  const pantsM = p.userData.legs[0].children[0].material; const shoeM = mat('#24262b');
  p.userData.knees = p.userData.legs.map(l => {
    l.children.forEach(c => { c.visible = false; });
    const th = box(0.17, 0.42, 0.2, pantsM); th.position.y = -0.21; l.add(th);
    const kn = new THREE.Group(); kn.position.y = -0.42; l.add(kn);
    const sh = box(0.16, 0.38, 0.19, pantsM); sh.position.y = -0.19; kn.add(sh);
    const sho = box(0.19, 0.1, 0.3, shoeM); sho.position.set(0, -0.39, 0.05); kn.add(sho);
    return kn;
  });
  return p;
}
function resetPose(p) {
  const U = p.userData; p.rotation.set(0, 0, 0); p.position.set(0, 0, 0);
  U.legs.forEach(l => l.rotation.set(0, 0, 0)); U.knees.forEach(k => k.rotation.set(0, 0, 0));
  U.arms.forEach(a => { a.rotation.set(0, 0, 0); a.scale.y = 1; }); U.head.rotation.set(0, 0, 0);
}
// k 0 = 立つ … 1 = 深くしゃがむ。足の裏は床についたまま
function poseSquat(p, k) {
  const U = p.userData; const th = 1.15 * k;
  U.legs.forEach(l => { l.rotation.x = -th; }); U.knees.forEach(n => { n.rotation.x = 2 * th; });
  p.position.y = -0.8 * (1 - Math.cos(th));
  U.arms.forEach(a => { a.rotation.x = -1.45 * Math.min(1, k * 1.6); });
  U.head.rotation.x = -0.1 * k;
}
// 仰向けで腹筋（クランチ）。k 0 = 寝る … 1 = 上体を起こす。wrap（腰の位置）ごと置く
const LYING = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0)));
function poseCrunch(p, wrap, k) {
  const U = p.userData; const c = 0.85 * k;
  p.position.set(0, -0.86, 0);
  wrap.quaternion.copy(LYING).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), c));
  const phi = 0.9;
  U.legs.forEach(l => { l.rotation.x = -phi - c; }); U.knees.forEach(n => { n.rotation.x = 1.0 + phi; });
  U.arms.forEach((a, i) => { a.rotation.set(-2.7, 0, i ? -0.5 : 0.5); });
  U.head.rotation.x = 0.25 * k;
}
// 歩く・走る（ph は位相、run で大きく）
function poseGait(p, ph, run = false) {
  const U = p.userData; const A = run ? 0.75 : 0.45; const s = Math.sin(ph);
  U.legs[0].rotation.x = s * A; U.legs[1].rotation.x = -s * A;
  U.knees[0].rotation.x = Math.max(0, Math.sin(ph + 1.2)) * (run ? 1.4 : 0.6);
  U.knees[1].rotation.x = Math.max(0, Math.sin(ph + 1.2 + Math.PI)) * (run ? 1.4 : 0.6);
  U.arms[0].rotation.x = -s * (run ? 0.9 : 0.4); U.arms[1].rotation.x = s * (run ? 0.9 : 0.4);
  if (run) { U.arms.forEach(a => { a.rotation.z = 0; }); p.rotation.x = 0.12; }
  p.position.y = Math.abs(Math.cos(ph)) * (run ? 0.12 : 0.03);
}

export function workoutVideo(cfg) {
  // cfg: { id, kind, title, titleHtml, subs, chips: { s2:[...], s3:[...], s4:[...], s5:[...], s6:[...], s7:[...] },
  //        counter: { label, total, unit, fmt }, rate, sets, mood: {cloud:true}, meta:{...} }
  const outdoor = cfg.kind === 'walk' || cfg.kind === 'run';
  const MAT_Z = 2.5;
  const you = kneePerson({ skin: SKIN[1], hair: HAIR[1], shirt: cfg.shirt || '#e05a4f', pants: '#2b2f3a' });
  const yogaMat = box(2.1, 0.02, 0.75, mat('#4f8fb3')); yogaMat.position.set(-0.55, 0.011, MAT_Z);
  const wrap = new THREE.Group();
  const phone = box(0.08, 0.15, 0.02, mat('#1b1d22'));
  const sweatM = new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.9 });
  const sweat = [0, 1, 2].map(() => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), sweatM); d.scale.set(1, 1.5, 1); return d; });
  const home = outdoor ? town : room;
  home.add(you); home.add(wrap); sweat.forEach(d => home.add(d));
  if (!outdoor) room.add(yogaMat);

  function homeUnwrap() { if (you.parent !== home) home.add(you); }
  // ---------- where we are ----------
  function place(env) {
    if (outdoor) { setTownEnv(env === 'evening' ? 'dusk' : 'day'); }
    else { setRoom({ sets: ['living'] }); setLight(env, env === 'evening' ? { ceil: 11, hemi: 0.95 } : {}); yogaMat.visible = true; }
  }
  function showSweat(on, t, base) { sweat.forEach((d, i) => { d.visible = on; if (on) { const k = ((t * 0.8 + i * 0.33) % 1); d.position.set(base.x - 0.05 + i * 0.07, base.y - k * 0.5, base.z + 0.12 - i * 0.08); } }); }
  // 運動を1コマ分。rate=回/秒（歩き・走りは歩調）、shaky=筋肉痛のふるえ。return 体の中心
  const WALK_X = 4.3;
  function exercise(t, rate, shaky = 0) {
    resetPose(you); phone.visible = false;
    if (cfg.kind === 'crunch') wrap.add(you); else homeUnwrap();
    const sh = Math.sin(t * 40) * 0.04 * shaky;
    if (cfg.kind === 'squat') {
      you.position.set(-0.55, 0, MAT_Z); you.rotation.y = Math.PI / 2;
      poseSquat(you, clamp(0.5 - 0.5 * Math.cos(t * rate * Math.PI * 2) + sh)); you.position.x = -0.55;
      return new THREE.Vector3(-0.55, 1.2, MAT_Z);
    }
    if (cfg.kind === 'crunch') {
      wrap.add(you); wrap.position.set(-0.3, 0.16, MAT_Z);
      poseCrunch(you, wrap, clamp(0.5 - 0.5 * Math.cos(t * rate * Math.PI * 2) + sh));
      return new THREE.Vector3(-0.7, 0.5, MAT_Z);
    }
    const run = cfg.kind === 'run'; const sp = run ? 2.2 : 1.3;
    const z = 30 - ((t * sp) % 60);
    you.position.set(WALK_X, 0.12, z); you.rotation.y = Math.PI;
    poseGait(you, t * rate * Math.PI * 2, run); you.position.y += 0.12;
    return new THREE.Vector3(WALK_X, 1.5, z);
  }
  // カメラ：運動している体を横から
  function exCam(t, c, d = 3, k = 0) {
    const u = ease(t / d);
    if (outdoor) look(c.x - lerp(7.0, 6.4, u) - k, lerp(2.6, 2.4, u), c.z - lerp(3.6, 4.4, u), c.x, 1.0, c.z - 0.8, 50);
    else if (cfg.kind === 'crunch') look(lerp(0.4, 0.1, u) + k, lerp(1.8, 1.7, u), lerp(7.0, 6.6, u) + k, -0.2, 0.35, MAT_Z, 50);
    else look(lerp(0.9, 0.6, u) + k, lerp(1.3, 1.2, u), lerp(7.9, 7.4, u) + k, -0.55, 0.85, MAT_Z, 50);
  }
  function idle(t) { // ふだん：立ってスマホ
    resetPose(you); homeUnwrap();
    const x = outdoor ? WALK_X : -0.4, z = outdoor ? 6 : 2.3;
    you.position.set(x, outdoor ? 0.12 : 0, z); you.rotation.y = outdoor ? Math.PI * 0.85 : 0.2;
    you.userData.arms[1].rotation.x = -1.1; you.userData.arms[0].rotation.x = -0.9; you.userData.head.rotation.x = 0.35;
    phone.visible = true; if (phone.parent !== you) you.add(phone); phone.position.set(0.05, 1.05, 0.42); phone.rotation.x = -0.6;
    const u = ease(t / 3.5);
    if (outdoor) look(x - 3.2, 1.8, z + lerp(4.2, 3.6, u), x, 1.2, z, 50);
    else look(lerp(0.6, 0.3, u), lerp(1.8, 1.7, u), lerp(7.4, 6.9, u), -0.4, 0.75, 2.3, 52);
  }

  // ---------- stage: 30-day calendar ----------
  const CAL = new THREE.Group(); stage.add(CAL);
  const tiles = [];
  for (let i = 0; i < 30; i++) {
    const c = i % 6, r = Math.floor(i / 6);
    const tile = box(1.25, 0.2, 1.25, mat('#26385e')); tile.position.set(-3.5 + c * 1.4, 0.4, -4.2 + r * 1.4); CAL.add(tile);
    const lab = textSprite(cfg.tileText || '100', { w: 256, h: 128, size: 70, color: '#ffffff', sx: 0.95 }); lab.position.set(tile.position.x, 0.85, tile.position.z); lab.material.depthTest = false; lab.renderOrder = 5; CAL.add(lab);
    tiles.push({ tile, lab });
  }
  const ON = new THREE.Color(cfg.shirt || '#e05a4f'), OFF = new THREE.Color('#26385e');
  function setDays(n) { tiles.forEach((x, i) => { const k = clamp(n - i); x.tile.material.color.copy(OFF).lerp(ON, k); x.tile.position.y = 0.4 + 0.12 * k; x.lab.visible = k > 0.5; }); }

  // ---------- stage: mood (dark cloud over the head clears, sun comes out) ----------
  const MOOD = new THREE.Group(); stage.add(MOOD);
  const mp = kneePerson({ skin: SKIN[1], hair: HAIR[1], shirt: cfg.shirt || '#e05a4f', pants: '#2b2f3a' }); MOOD.add(mp);
  const cloud = new THREE.Group(); MOOD.add(cloud);
  const cloudM = mat('#5b6270', { transparent: true });
  [[0, 0, 0.55], [0.5, -0.05, 0.42], [-0.5, -0.05, 0.42], [0.25, 0.25, 0.4], [-0.25, 0.22, 0.38]].forEach(([x, y, r]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), cloudM); s.position.set(x, y, 0); cloud.add(s); });
  const rainM = new THREE.MeshBasicMaterial({ color: 0x9fb4d8, transparent: true, opacity: 0.8 });
  const rain = Array.from({ length: 14 }, () => { const d = box(0.025, 0.18, 0.025, rainM); cloud.add(d); return d; });
  const sunM = new THREE.MeshBasicMaterial({ color: 0xffd23f });
  const sunB = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), sunM); MOOD.add(sunB);
  const rays = Array.from({ length: 10 }, (_, i) => { const r = box(0.08, 0.35, 0.05, sunM); const a = i / 10 * Math.PI * 2; r.position.set(Math.cos(a) * 0.82, Math.sin(a) * 0.82, 0); r.rotation.z = a - Math.PI / 2; sunB.add(r); return r; });
  function moodSet(t, k) { // k 0 = 雲 … 1 = 晴れ
    resetPose(mp); mp.position.set(0, 0.3, 0); mp.rotation.y = 0.15;
    mp.userData.head.rotation.x = lerp(0.45, -0.2, k); mp.userData.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * lerp(0, 2.6, ease(clamp((k - 0.6) / 0.4))); });
    cloud.position.set(0, 2.9 + k * 0.6, 0); cloud.scale.setScalar(Math.max(0.001, 1 - k)); cloud.visible = k < 0.98; cloudM.opacity = 1 - k * 0.7;
    rain.forEach((d, i) => { const ph = (t * 1.6 + i * 0.37) % 1; d.position.set(-0.6 + (i % 7) * 0.2, -0.3 - ph * 1.2, (i % 2) * 0.1); d.visible = k < 0.5; });
    sunB.position.set(1.1, lerp(1.2, 3.4, ease(k)), -0.6); sunB.scale.setScalar(Math.max(0.001, ease(clamp((k - 0.3) / 0.7)))); sunB.rotation.z = t * 0.5;
  }

  // ---------- counter ----------
  const C = cfg.counter;
  const counter = (n, op = 1, color = '#fff') => setHud(C.label, C.fmt(Math.min(C.total, n)), op, { mono: true, color });

  // chips: [[t0, t1, label, value(t)|string, color]]
  function chips(list, t) {
    for (const [a, b, lab, val, col] of list || []) if (t >= a && t < b) { setTop(lab, typeof val === 'function' ? val(t) : val, fade(t, a + 0.15 * (a === 0), b, 0.25), col || '#fff'); return; }
  }
  const CH = cfg.chips || {};

  // ---------- shots ----------
  function shot0(t) { lift(90); place('evening'); const c = exercise(t, cfg.rate); showSweat(false, t, c); exCam(t, c, 2.5); el.title.style.opacity = 1; counter(t * C.perSec); return home; }
  function shot1(t) { lift(200); place('evening'); showSweat(false, t, new THREE.Vector3()); idle(t); el.title.style.opacity = clamp(1 - (t - 0.3) / 0.5); return home; }
  function shot2(t) {
    lift(90); place('evening');
    const n = clamp(t / 6.8) * C.total; const c = exercise(t, cfg.rate);
    showSweat(t > 3, t, c); exCam(t, c, 8, 0.15); hudTime('+1日'); counter(n, 1, n >= C.total ? '#7ff0c8' : '#fff');
    chips(CH.s2, t); return home;
  }
  function shot3(t) {
    lift(90); place('evening');
    const c = exercise(t, cfg.rate * 0.55, 1);
    showSweat(true, t, c); exCam(t, c, 8, 0.6); hudTime('+2日'); chips(CH.s3, t); return home;
  }
  function calShot(t, n0, n1, dur) { lift(260); setStageColor('#14213a'); CAL.visible = true; MOOD.visible = false; setDays(lerp(n0, n1, ease(clamp((t - 0.3) / dur)))); }
  function shot4(t) { calShot(t, 2, 20, 4.5); const u = ease(t / 8); look(lerp(-1.2, 0, u), lerp(14, 13.5, u), lerp(8.5, 8.0, u), 0, 0, -1.4, 50); hudTime('+20日'); chips(CH.s4, t); return stage; }
  function shot5(t) { calShot(t, 20, 30, 2.5); const u = ease(t / 9); look(lerp(0, 0.2, u), lerp(15.5, 16.3, u), lerp(9.0, 9.8, u), 0, 0, -1.4, 50); hudTime('+30日'); chips(CH.s5, t); return stage; }
  function shot6(t) {
    lift(250); setStageColor('#1a2440'); CAL.visible = false; MOOD.visible = true;
    moodSet(t, ease(clamp((t - (cfg.moodDelay ?? 1.0)) / (cfg.moodDelay ? 3.0 : 5.0))));
    const u = ease(t / 8.8); look(lerp(0.6, 0.2, u), lerp(2.6, 2.9, u), lerp(8.4, 7.6, u), 0.2, 2.0, 0, 50);
    chips(CH.s6, t); return stage;
  }
  function shot7(t) {
    lift(200); place('evening'); showSweat(false, t, new THREE.Vector3()); resetPose(you); homeUnwrap();
    const x = outdoor ? WALK_X : -0.5, z = outdoor ? 2 : 2.4;
    you.position.set(x, outdoor ? 0.12 : 0, z); you.rotation.y = outdoor ? Math.PI * 0.8 : 0.2;
    const s = ease(clamp((t - 0.5) / 1.2)); you.userData.arms[0].rotation.z = -2.6 * s; you.userData.arms[1].rotation.z = 2.6 * s;
    const u = ease(t / 7.5);
    if (outdoor) look(x - lerp(4.4, 5.0, u), lerp(1.9, 2.1, u), z + lerp(5.8, 6.4, u), x, 1.1, z, 50);
    else look(lerp(0.5, 0.9, u), lerp(1.5, 1.6, u), lerp(7.6, 8.2, u), -0.5, 1.0, 2.4, 50);
    chips(CH.s7, t); return home;
  }
  function shot8(t) { lift(90); place('evening'); const c = exercise(t + 3, cfg.rate); showSweat(true, t, c); exCam(t + 0.5, c, 4.5); counter(C.total, 1, '#7ff0c8'); return home; }
  function scenesOff() { CAL.visible = false; MOOD.visible = false; phone.visible = false; }

  const shots = [
    { a: 0, b: 2.5, f: shot0 }, { a: 2.5, b: 6, f: shot1 }, { a: 6, b: 14, f: shot2 }, { a: 14, b: 22, f: shot3 },
    { a: 22, b: 30, f: shot4 }, { a: 30, b: 39.2, f: shot5 }, { a: 39.2, b: 48, f: shot6 }, { a: 48, b: 55.5, f: shot7 },
    { a: 55.5, b: 59.5, f: shot8 }, { a: 59.5, b: 64.5, f: endCard },
  ];
  shots.forEach(s => { const f = s.f; s.f = (t, T) => { scenesOff(); return f(t, T); }; });
  // cfg.cut / cfg.duration：v2 で冒頭の日常を抜くとき用（runStory の cut と同じ。2026/10/28〜）
  runStory({ shots, subs: cfg.subs, duration: cfg.duration || 64.5, cut: cfg.cut, meta: { id: cfg.id, title: cfg.title, titleHtml: cfg.titleHtml, hookType: 'H4', cat: '体・健康', ...cfg.meta } });
}
