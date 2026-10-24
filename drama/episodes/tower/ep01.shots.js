// タワマン孤島 第1話「流すな」— 映像（ショット）・効果音・BGM
import { W, H, clamp, lerp, inv, ease, easeOut, back, ss, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, cam, shake, darkness, text, tag, FONT, SERIF } from '../../engine/core.js';
import { PEOPLE, person, bust, SKIN } from '../../engine/people.js';
import { sky, skyline, tower, room, bath, toilet, corridor, doorInside, elevatorHall, speaker, paper, section } from '../../engine/sets.js';
import { runEpisode } from '../../engine/player.js';
import { SERIES, EPISODE, CAST, LINES } from './ep01.script.js';

const P = PEOPLE;
// 話している間だけ口を動かす
const talking = (lt, S, ids) => { for (const id of ids) { const a = S.L(id), b = S.Le(id); if (lt >= a && lt <= b) return 0.35 + 0.65 * Math.abs(Math.sin((lt - a) * 13)); } return 0; };
const blinkAt = (lt, seed = 0) => ((lt + seed * 1.7) % 3.4) < 0.12;
// 手（指に絆創膏）
function hand(g, x, y, s, { plaster = true, rot = 0 } = {}) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  fillRR(g, -70, -40, 140, 150, 50, SKIN);
  const fingers = [[-52, -120, 30, 110], [-18, -150, 32, 135], [18, -142, 32, 128], [52, -112, 28, 100]];
  fingers.forEach(([fx, fy, fw, fh], i) => { fillRR(g, fx - fw / 2, fy, fw, fh, fw / 2, SKIN); if (plaster && i === 1) { fillRR(g, fx - fw / 2 - 3, fy + 22, fw + 6, 34, 8, '#e9c79a'); for (let k = 0; k < 3; k++) circ(g, fx - 6 + k * 6, fy + 39, 1.8, '#c9a272'); } });
  g.save(); g.rotate(0.9); fillRR(g, -10, -10, 34, 90, 17, SKIN); g.restore();
  line(g, -40, 40, 30, 60, 3, 'rgba(160,110,90,.25)');
  g.restore();
}
// スマホ
function phone(g, x, y, s, { mode = 'time', t = 0, vib = 0 } = {}) {
  g.save(); g.translate(x + (vib ? noise1(t * 40, 2) * 6 * vib : 0), y); g.scale(s, s);
  fillRR(g, -150, -300, 300, 600, 44, '#17181d'); fillRR(g, -136, -284, 272, 568, 34, mode === 'alert' ? '#5a1414' : '#1d2a44');
  if (mode === 'time') { text(g, '19:42', 0, -150, { size: 92, color: '#fff', weight: 500 }); text(g, '10月25日 土曜日', 0, -78, { size: 24, color: '#cdd6e6', weight: 500 }); }
  else {
    const fl = (Math.floor(t * 4) % 2) ? 1 : 0.7;
    fillRR(g, -120, -170, 240, 300, 26, rgba('#ff3b30', fl));
    text(g, '地震速報', 0, -105, { size: 46, color: '#fff' }); text(g, '強い揺れに', 0, -25, { size: 34, color: '#fff' }); text(g, '警戒してください', 0, 25, { size: 30, color: '#fff' });
  }
  g.restore();
}
// 紙の図解の見出し
const head = (g, s, y = 200, a = 1) => tag(g, s, 540, y, { size: 44, bg: '#2b2f3f', color: '#fff', pad: 26, alpha: a });

// 夜の部屋の光（スマホのライト）
const phoneLight = (x, y, r = 520) => ({ x, y, r, color: 'rgba(255,236,200,1)', glow: 0.25 });

const SHOTS = [
  // ── フック：見上げるタワマン、32階だけ光る
  { at: 'h1', draw(g, lt, D, S) {
    const k = ease(clamp(lt / D));
    g.save(); cam(g, { x: 540, y: lerp(1250, 420, k), z: lerp(1.0, 1.25, k) });
    sky(g, { dark: 0.3, y0: -900, h: 3200 });
    skyline(g, { y: 1900, dark: 0.2, seed: 2, scale: 1.4, color: '#20284a', density: 0.4 });
    tower(g, { cx: 540, base: 2100, top: -620, w: 520, wt: 360, floors: 45, dark: 0.15, hi: 32, hiA: 1 });
    skyline(g, { y: 2300, dark: 0.1, seed: 9, scale: 2.2, color: '#121730', density: 0.3 });
    g.restore();
    const y32 = 2100 - 31.5 * (2720 / 45);
    g.save(); cam(g, { x: 540, y: lerp(1250, 420, k), z: lerp(1.0, 1.25, k) }); tag(g, '32階', 790, y32 + 10, { size: 40, bg: '#ffd451', color: '#1b1b22', alpha: inv(1.2, 1.8, lt) }); g.restore();
  } },
  // ── 絶対に流すな
  { at: 'h2', finish: { vignette: 0.6 }, draw(g, lt, D, S) {
    g.save(); cam(g, { x: 600, y: 760, z: lerp(1.5, 1.62, lt / D) });
    toilet(g, { power: 0.35 }); g.restore();
    darkness(g, 0.4, '#05070d', [phoneLight(640, 640, 700)]);
    const a = easeOut(inv(0.5, 0.75, lt)), s = lerp(1.6, 1, back(inv(0.5, 0.85, lt)));
    if (a > 0) { g.save(); g.translate(640, 640); g.scale(s, s); g.globalAlpha = a; g.lineWidth = 34; g.strokeStyle = '#ff3b30'; g.beginPath(); g.arc(0, 0, 230, 0, 7); g.stroke(); line(g, -160, -160, 160, 160, 34, '#ff3b30'); g.restore(); }
  } },
  // ── 地上100メートル、闇の中の孤島
  { at: 'h3', draw(g, lt, D, S) {
    const k = ease(clamp(lt / D));
    g.save(); cam(g, { x: 540, y: 980, z: lerp(1.25, 1.0, k) });
    sky(g, { dark: 0.9 });
    vgrad(g, -400, 1250, W + 800, 900, [[0, '#0b0e1a'], [1, '#05060c']]);
    skyline(g, { y: 1420, dark: 0.985, seed: 4, scale: 0.7, color: '#0e1222', density: 0.5 });
    skyline(g, { y: 1560, dark: 0.985, seed: 14, scale: 1.0, color: '#0a0d19', density: 0.5 });
    const T = tower(g, { cx: 540, base: 1560, top: 330, w: 210, wt: 170, floors: 45, dark: 0.9, hi: 32, hiA: 0.9, emergency: 1 });
    const y32 = T.floorY(32);
    const a = inv(0.3, 0.9, lt);
    g.save(); g.globalAlpha = a; g.setLineDash([14, 12]); line(g, 720, 1560, 720, y32, 5, '#ffd451', 'butt'); g.setLineDash([]); line(g, 690, y32, 750, y32, 5, '#ffd451'); line(g, 690, 1560, 750, 1560, 5, '#ffd451'); g.restore();
    tag(g, '地上100m', 860, (1560 + y32) / 2, { size: 40, bg: '#ffd451', color: '#1b1b22', alpha: a });
    g.restore();
    // 霧
    vgrad(g, 0, 1350, W, 400, [[0, 'rgba(20,24,40,0)'], [0.5, 'rgba(20,24,40,.5)'], [1, 'rgba(20,24,40,0)']]);
  } },
  // ── タイトル
  { at: 'title', noSubs: true, finish: { vignette: 0.7, grainA: 0.1 }, draw(g, lt, D, S) {
    vgrad(g, 0, 0, W, H, [[0, '#0b0d16'], [1, '#05060a']]);
    glow(g, 540, 820, 520, 'rgba(160,30,30,1)', 0.25 * inv(0, 0.4, lt));
    const a = easeOut(inv(0.05, 0.5, lt));
    g.save(); g.globalAlpha = a; g.translate(0, (1 - a) * 20);
    text(g, '全5話', 540, 640, { size: 34, color: '#b9b2a4', font: FONT, weight: 800, spacing: 8 });
    text(g, 'タワマン孤島', 540, 780, { size: 150, color: '#f3efe6', font: SERIF, weight: 700, spacing: 6 });
    g.restore();
    const lw = 560 * easeOut(inv(0.3, 0.9, lt)); line(g, 540 - lw / 2, 885, 540 + lw / 2, 885, 6, '#d63a32');
    const b = easeOut(inv(0.6, 1.1, lt));
    text(g, '第1話', 540, 970, { size: 46, color: '#d63a32', alpha: b });
    text(g, '流すな', 540, 1060, { size: 96, color: '#f3efe6', font: SERIF, weight: 700, alpha: b, spacing: 10 });
  } },
  // ── ミオの日常
  { at: 'a1', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 560, y: 980, z: lerp(1.0, 1.06, lt / D) });
    room(g, { power: 1, cityDark: 0 });
    person(g, P.mio, { x: 560, y: 1460, s: 1.35, arms: [10, 0, 20, -110], hold: 'mug', mouth: 'smile', blink: blinkAt(lt), lookX: 0.4 });
    g.restore();
    tag(g, '水野ミオ（29）', 540, 330, { size: 42, alpha: inv(0.3, 0.7, lt) });
    tag(g, '32階・賃貸・ひとり暮らし', 540, 410, { size: 32, bg: '#2b2f3f', color: '#fff', alpha: inv(1.2, 1.6, lt) });
  } },
  { at: 'a2', draw(g, lt, D, S) {
    const k = ease(clamp(lt / D));
    g.save(); cam(g, { x: 540, y: 740, z: lerp(1.25, 1.4, k) });
    room(g, { power: 1, cityDark: 0 });
    g.restore();
    // 窓辺のミオ（うしろ姿ぎみ）
    g.save(); g.globalAlpha = 0.95; person(g, P.mio, { x: 300, y: 1520, s: 1.6, turn: -0.8, eyes: 'closed', mouth: 'smile', arms: [8, 0, 8, 0] }); g.restore();
  } },
  // ── 19:42 スマホ → 地震速報
  { at: 'a3', draw(g, lt, D, S) {
    vgrad(g, 0, 0, W, H, [[0, '#9a6c47'], [1, '#7a5236']]);
    for (let i = 0; i < 7; i++) line(g, 0, 300 + i * 260, W, 260 + i * 260, 3, 'rgba(0,0,0,.08)');
    const alert = lt > S.L('alert');
    const tt = lt - S.L('alert');
    g.save(); cam(g, { x: 540, y: 900, z: alert ? 1.15 : lerp(1, 1.08, lt / 2) });
    phone(g, 540, 820, 1.25, { mode: alert ? 'alert' : 'time', t: lt, vib: alert ? 1 : 0 });
    if (alert) for (let i = 0; i < 2; i++) { const p = (tt * 2 + i / 2) % 1; g.save(); g.globalAlpha = (1 - p) * 0.5; g.lineWidth = 6; g.strokeStyle = '#ff6a5a'; rr(g, 540 - 200 - p * 80, 820 - 390 - p * 80, 400 + p * 160, 780 + p * 160, 60); g.stroke(); g.restore(); }
    g.restore();
  } },
  // ── 揺れ（部屋）
  { at: 'q1', draw(g, lt, D, S) {
    const sh = shake(lt, 26 * (0.6 + 0.4 * Math.sin(lt * 1.3)));
    g.save(); cam(g, { x: 540, y: 960, z: 1.08, ...sh, r: Math.sin(lt * 2.2) * 0.035 });
    room(g, { power: 1, swing: Math.sin(lt * 3.1), cityDark: 0 });
    person(g, P.mio, { x: 560, y: 1480, s: 1.3, crouch: 1, arms: [150, 60, 150, 60], eyes: 'closed', brow: -1, mouth: 'frown', headDy: 30 });
    g.restore();
  } },
  // ── 図解：高層階ほど長く大きく揺れる
  { at: 'q2', draw(g, lt, D, S) {
    paper(g);
    head(g, '長周期地震動', 230, inv(0, 0.3, lt));
    const amp = 120 * Math.sin(lt * 2.6) * Math.min(1, lt / 0.8);
    section(g, { cx: 380, top: 420, bot: 1480, w: 300, floors: 15, hi: 11, bend: amp });
    section(g, { cx: 830, top: 1150, bot: 1480, w: 240, floors: 4, bend: amp * 0.12, tint: '#e9e1cf' });
    const a = inv(0.5, 0.9, lt);
    tag(g, '32階', 380 + amp * 0.82 + 230, 1480 - 10.5 * (1060 / 15), { size: 34, bg: '#ffd451', color: '#1b1b22', alpha: a });
    g.save(); g.globalAlpha = a; line(g, 380 + amp - 60, 380, 380 + amp + 60, 380, 8, '#d63a32'); poly(g, [[380 + amp + 80, 380], [380 + amp + 55, 362], [380 + amp + 55, 398]], '#d63a32'); poly(g, [[380 + amp - 80, 380], [380 + amp - 55, 362], [380 + amp - 55, 398]], '#d63a32'); g.restore();
    tag(g, '大きく・長く', 380, 320, { size: 34, bg: '#d63a32', color: '#fff', alpha: a });
    tag(g, '低い建物', 830, 1080, { size: 30, bg: '#6b5e4a', color: '#fff', alpha: a });
  } },
  // ── ソファが滑ってくる
  { at: 'q3', draw(g, lt, D, S) {
    const k = ease(inv(0.1, 1.4, lt));
    const sh = shake(lt + 5, 18);
    g.save(); cam(g, { x: 560, y: 1080, z: 1.12, ...sh, r: Math.sin(lt * 2.4) * 0.03 });
    room(g, { power: 1, swing: Math.sin(lt * 3.1 + 1), sofaX: k * 330 });
    const jump = inv(0.7, 1.1, lt);
    person(g, P.mio, { x: lerp(620, 930, ease(jump)), y: 1490 - Math.sin(jump * Math.PI) * 60, s: 1.25, eyes: 'wide', brow: -1, mouth: 'o', arms: [70, -30, 70, -30], turn: 0.6 });
    g.restore();
  } },
  // ── 停電
  { at: 'q4', draw(g, lt, D, S) {
    const off = lt > 0.55 ? 1 : 0;
    const cd = ease(inv(0.9, 2.4, lt));
    g.save(); cam(g, { x: 540, y: 900, z: 1.05 });
    room(g, { power: 1 - off, cityDark: cd, swing: Math.sin(lt * 2) * 0.4 * (1 - lt / D) });
    person(g, P.mio, { x: 820, y: 1470, s: 1.25, eyes: 'wide', brow: -1, mouth: 'o', turn: -0.5, lookX: -1, alpha: 1 });
    g.restore();
    if (off) darkness(g, 0.4 + 0.2 * cd, '#04060c', [{ x: 540, y: 700, r: 900, a: 0.5 }]);
    if (lt > 0.5 && lt < 0.62) { g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 0, W, H); }
  } },
  // ── エレベーター停止
  { at: 'e1', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 900, z: lerp(1.0, 1.12, lt / D) });
    elevatorHall(g, { t: lt, power: 0 });
    g.restore();
    darkness(g, 0.32, '#04060c', [{ x: 300, y: 480, r: 380, color: 'rgba(255,90,60,1)', glow: 0.3 }, { x: 780, y: 480, r: 380, color: 'rgba(255,90,60,1)', glow: 0.3 }]);
    tag(g, '地震時管制運転', 540, 300, { size: 38, bg: '#2b2f3f', color: '#fff', alpha: inv(0.4, 0.8, lt) });
  } },
  // ── 6万6千台
  { at: 'e2', draw(g, lt, D, S) {
    paper(g, { color: '#ece3d0' });
    head(g, '2018年 大阪北部地震', 220, inv(0, 0.3, lt));
    const n = Math.floor(easeOut(inv(0.4, 2.6, lt)) * 66000);
    const cols = 12, rows = 8, cell = 74;
    const shown = Math.floor(easeOut(inv(0.3, 2.8, lt)) * cols * rows);
    for (let i = 0; i < cols * rows; i++) {
      const c = i % cols, r = Math.floor(i / cols), x = 540 - cols * cell / 2 + c * cell + cell / 2, y = 330 + r * cell + cell / 2;
      const on = i < shown;
      fillRR(g, x - 26, y - 30, 52, 60, 8, on ? '#d63a32' : '#c9bea6');
      line(g, x, y - 24, x, y + 24, 3, on ? '#9a2620' : '#b3a88f', 'butt');
    }
    const v = n.toLocaleString('ja-JP');
    text(g, '止まったエレベーター', 540, 975, { size: 36, color: '#6b5e4a' });
    text(g, `約${v}台`, 540, 1068, { size: 110, color: '#d63a32', stroke: '#fff7ea', sw: 14 });
    text(g, '出典：国土交通省', 540, 1420, { size: 26, color: '#8a7d66', weight: 500 });
    const st = inv(S.Le('e2') + 0.1, S.Le('e2') + 0.4, lt);
    if (st > 0) { g.save(); g.translate(760, 520); g.rotate(-0.18); g.scale(lerp(1.6, 1, back(st)), lerp(1.6, 1, back(st))); g.globalAlpha = Math.min(1, st * 2); g.lineWidth = 10; g.strokeStyle = '#d63a32'; rr(g, -210, -70, 420, 140, 20); g.stroke(); text(g, '点検は順番待ち', 0, 4, { size: 50, color: '#d63a32' }); g.restore(); }
  } },
  // ── 浴室：蛇口をひねる
  { at: 'w1', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 560, y: 1000, z: lerp(1.05, 1.15, lt / D) });
    const st = ease(inv(0.5, 0.9, lt));
    const B = bath(g, { level: 0.05 + st * 0.04, stream: st, t: lt, power: 0.25 });
    // ミオの手
    g.save(); g.translate(700, 605); g.rotate(-0.9 + st * 1.2); fillRR(g, -14, -14, 170, 28, 14, '#d6dde4'); circ(g, 0, 0, 30, '#aab3bd'); g.restore();
    g.restore();
    darkness(g, 0.32, '#04060c', [phoneLight(600, 760, 800)]);
  } },
  // ── 図解：ポンプで押し上げる水
  { at: 'w2', draw(g, lt, D, S) {
    paper(g);
    const cut = lt > S.L('w3') + 0.3;
    head(g, cut ? '停電でポンプが止まる' : '高層階の水のしくみ', 220);
    const sec = section(g, { cx: 470, top: 360, bot: 1460, w: 380, floors: 14, hi: 11 });
    // パイプ
    const px = 740; line(g, px, 1500, px, 400, 26, '#6aa9d6', 'butt'); line(g, px, 400, 660, 400, 26, '#6aa9d6', 'butt');
    for (let f = 1; f <= 14; f++) line(g, 660, sec.y(f), px, sec.y(f), 8, '#6aa9d6', 'butt');
    // 流れる水（点線）
    g.save(); g.setLineDash([26, 30]); g.lineDashOffset = cut ? -(S.L('w3') + 0.3) * 160 : -lt * 160; g.globalAlpha = cut ? Math.max(0, 1 - (lt - S.L('w3') - 0.3) * 1.2) : 1;
    line(g, px, 1500, px, 400, 10, '#ffffff', 'butt'); g.restore();
    // ポンプ
    fillRR(g, px - 90, 1480, 180, 130, 20, cut ? '#7b7468' : '#2f6d9a'); text(g, 'ポンプ', px, 1520, { size: 34, color: '#fff' });
    text(g, '⚡', px, 1575, { size: 40, color: cut ? '#555' : '#ffd451' });
    if (cut) { const a = inv(S.L('w3') + 0.2, S.L('w3') + 0.5, lt); g.save(); g.globalAlpha = a; line(g, px - 110, 1460, px + 110, 1630, 16, '#d63a32'); line(g, px + 110, 1460, px - 110, 1630, 16, '#d63a32'); g.restore(); }
    tag(g, '32階', 470, sec.y(11), { size: 34, bg: '#ffd451', color: '#1b1b22' });
    tag(g, '電気で押し上げる', 860, 300, { size: 32, bg: '#2f6d9a', color: '#fff', alpha: inv(0.3, 0.7, lt) });
  } },
  // ── 最後の水
  { at: 'w4', draw(g, lt, D, S) {
    const k = clamp(lt / D);
    const z = lt > S.L('w5') ? lerp(1.15, 1.6, ease(inv(S.L('w5'), D, lt))) : 1.15;
    const fy = lt > S.L('w5') ? lerp(1000, 1330, ease(inv(S.L('w5'), D, lt))) : 1000;
    g.save(); cam(g, { x: 560, y: fy, z });
    const stream = Math.max(0, 0.6 - lt * 0.4) * (Math.sin(lt * 17) > -0.2 ? 1 : 0.2);
    const B = bath(g, { level: 0.12, stream, t: lt, power: 0.25, drops: lt > 1.4 ? 0.6 : 0 });
    if (lt > S.L('w5')) { const a = inv(S.L('w5') + 0.3, S.L('w5') + 0.8, lt); line(g, 930, B.wl, 930, 1480, 6, rgba('#d63a32', a)); line(g, 905, B.wl, 955, B.wl, 6, rgba('#d63a32', a)); }
    g.restore();
    darkness(g, 0.32, '#04060c', [phoneLight(560, 1000, 850)]);
    if (lt > S.L('w5')) tag(g, '数センチ', 540, 990, { size: 44, bg: '#d63a32', color: '#fff', alpha: inv(S.L('w5') + 0.3, S.L('w5') + 0.8, lt) });
    if (lt > S.L('w5') + 1.5) glow(g, 540, 1300, 500, 'rgba(120,200,255,1)', 0.25 * inv(S.L('w5') + 1.5, D, lt));
  } },
  // ── ノック（玄関・暗い）
  { at: 'knock1', draw(g, lt, D, S) {
    const kn = [0.05, 0.3, 0.55].some(x => lt > x && lt < x + 0.1) ? 1 : 0;
    g.save(); cam(g, { x: 540, y: 820, z: 1.05, sx: kn * 6 });
    doorInside(g, { shakeX: kn * 5, chain: 1 });
    g.restore();
    darkness(g, 0.43, '#04060c', [phoneLight(540, 1500, 900)]);
    if (lt > S.L('s1')) { /* 声だけ */ }
  } },
  // ── 廊下：柴田さんとことね
  { at: 's2', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 900, y: 960, z: 0.9 });
    corridor(g, { power: 0, doors: ['3201', '3202', '3203', '3204'] });
    person(g, P.shiba, { x: 470, y: 1420, s: 1.2, arms: [10, 0, 35, -100], hold: 'flashlight', mouth: 'smile', brow: -0.6, blink: blinkAt(lt, 1), showPlaster: true });
    person(g, P.koto, { x: 640, y: 1420, s: 1.2, arms: [-10, 0, 30, -30], eyes: 'dot', blink: blinkAt(lt, 2), mouth: 'line' });
    person(g, P.mio, { x: 1170, y: 1420, s: 1.2, turn: -0.5, arms: [10, 0, 20, -90], hold: 'phoneLight', brow: -0.5, blink: blinkAt(lt, 3) });
    g.restore();
    darkness(g, 0.36, '#04060c', [{ x: 470, y: 900, r: 600, color: 'rgba(255,230,180,1)', glow: 0.2 }, { x: 760, y: 950, r: 500, color: 'rgba(255,230,180,1)', glow: 0.1 }]);
    tag(g, '柴田さん（3201号室）', 330, 520, { size: 34, alpha: inv(0.2, 0.6, lt) });
    tag(g, 'ことね（6）', 520, 1010, { size: 32, alpha: inv(1.2, 1.6, lt) });
  } },
  // ── 指の絆創膏
  { at: 's3', draw(g, lt, D, S) {
    vgrad(g, 0, 0, W, H, [[0, '#262a38'], [1, '#14161f']]);
    glow(g, 540, 800, 700, 'rgba(255,225,170,1)', 0.25);
    hand(g, 540, 900 + (1 - easeOut(inv(0, 0.6, lt))) * 60, 2.4, { plaster: true, rot: -0.12 });
    const a = inv(S.L('s3') + 1.0, S.L('s3') + 1.4, lt);
    g.save(); g.globalAlpha = a; g.lineWidth = 10; g.strokeStyle = '#ffd451'; g.beginPath(); g.arc(480, 680, 120, 0, 7); g.stroke(); g.restore();
  } },
  // ── ことね「おトイレ」→ 柴田「行っといで」
  { at: 's4', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 560, y: 1050, z: 1.35 });
    corridor(g, { power: 0, doors: ['3201', '3202'], stairs: false });
    person(g, P.shiba, { x: 430, y: 1420, s: 1.2, arms: [10, 0, 35, -100], hold: 'flashlight', mouth: 'smile', talk: talking(lt, S, ['s5']), turn: 0.4, lookX: 1, blink: blinkAt(lt, 1) });
    person(g, P.koto, { x: 650, y: 1420, s: 1.2, arms: [-60, -40, 10, 0], turn: -0.4, lookX: -1, lookY: -1, talk: talking(lt, S, ['s4']), eyes: 'dot', brow: -0.5 });
    g.restore();
    darkness(g, 0.36, '#04060c', [{ x: 470, y: 820, r: 700, color: 'rgba(255,230,180,1)', glow: 0.2 }]);
  } },
  // ── ミオ「待って！」
  { at: 's6', draw(g, lt, D, S) {
    const sh = shake(lt, lt < 0.4 ? 14 : 0);
    g.save(); cam(g, { x: 540, y: 900, z: lerp(1.05, 1.0, easeOut(inv(0, 0.3, lt))), ...sh });
    vgrad(g, -200, -200, W + 400, H + 400, [[0, '#2a2c3a'], [1, '#16171f']]);
    bust(g, P.mio, { x: 540, y: 820, s: 3.4, eyes: 'wide', brow: -1, mouth: 'shout', talk: talking(lt, S, ['s6']) > 0 ? 0 : 0 });
    g.restore();
    darkness(g, 0.25, '#04060c', [phoneLight(540, 1100, 900)]);
  } },
  // ── 図解：割れた排水管
  { at: 'r1', draw(g, lt, D, S) {
    paper(g);
    head(g, '地震のあとの排水管', 220);
    const sec = section(g, { cx: 470, top: 360, bot: 1460, w: 400, floors: 12, hi: 11 });
    const px = 760;
    line(g, px, 360, px, 1500, 30, '#9b8f7a', 'butt');
    for (let f = 1; f <= 12; f++) line(g, 670, sec.y(f) + 30, px, sec.y(f) + 30, 10, '#9b8f7a', 'butt');
    // ひび
    const cy = sec.y(5) + 10; const ca = inv(0.3, 0.7, lt);
    g.save(); g.globalAlpha = ca; g.lineWidth = 7; g.strokeStyle = '#d63a32'; g.beginPath(); g.moveTo(px - 20, cy - 40); g.lineTo(px + 8, cy - 15); g.lineTo(px - 10, cy + 5); g.lineTo(px + 14, cy + 30); g.stroke(); g.restore();
    tag(g, '割れ目', px + 130, cy, { size: 32, bg: '#d63a32', color: '#fff', alpha: ca });
    // 流した水が落ちてきて、割れ目からあふれる
    const r2 = S.L('r2');
    const drop = inv(r2 - 0.2, r2 + 1.1, lt);
    if (drop > 0 && drop < 1) circ(g, px, lerp(sec.y(11), cy, easeIn2(drop)), 18, '#7a5a32');
    const spill = ease(inv(r2 + 1.0, r2 + 2.6, lt));
    if (spill > 0) {
      g.save(); g.globalAlpha = 0.85; fillRR(g, 270, sec.y(5) + sec.fh / 2 - 12 - spill * (sec.fh - 20), 400, spill * (sec.fh - 20), 4, '#8a6236'); g.restore();
      for (let i = 0; i < 3; i++) circ(g, px - 30 - i * 30, cy + 20 + ((lt * 300 + i * 40) % 60), 8, '#8a6236');
      tag(g, '下の階に汚水', 470, sec.y(5) - sec.fh * 0.05, { size: 34, bg: '#7a5a32', color: '#fff', alpha: inv(r2 + 1.5, r2 + 1.9, lt) });
    }
    tag(g, '32階で流すと…', 470, sec.y(11), { size: 32, bg: '#ffd451', color: '#1b1b22', alpha: inv(r2 - 0.3, r2, lt) });
  } },
  // ── 掟カード
  { at: 'r3', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 960, z: 1.1 }); toilet(g, { power: 0.3 }); g.restore();
    g.fillStyle = 'rgba(8,10,16,.72)'; g.fillRect(0, 0, W, H);
    const a = inv(0.0, 0.3, lt), s = lerp(1.25, 1, back(a));
    if (a > 0) {
      g.save(); g.translate(540, 760); g.scale(s, s); g.globalAlpha = Math.min(1, a * 1.5); g.rotate(-0.02);
      g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 40; g.shadowOffsetY = 14;
      fillRR(g, -420, -250, 840, 500, 26, '#f5edda'); g.shadowColor = 'transparent';
      g.lineWidth = 6; g.strokeStyle = '#d63a32'; rr(g, -396, -226, 792, 452, 18); g.stroke();
      tag(g, 'タワマンの掟　その1', 0, -150, { size: 40, bg: '#d63a32', color: '#fff', pad: 28 });
      text(g, '排水管が無事とわかるまで', 0, -20, { size: 56, color: '#2b2530' });
      text(g, 'トイレは流すな', 0, 90, { size: 84, color: '#d63a32' });
      g.restore();
    }
  } },
  // ── 即席トイレ
  { at: 'r4', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 980, z: lerp(1.3, 1.4, lt / D) });
    toilet(g, { power: 0.3, bag: ease(inv(0.3, 1.0, lt)), paper: ease(inv(1.6, 3.2, lt)) });
    g.restore();
    darkness(g, 0.29, '#04060c', [phoneLight(540, 900, 850)]);
    tag(g, 'ゴミ袋をかぶせる', 540, 420, { size: 36, bg: '#2b2f3f', color: '#fff', alpha: inv(0.5, 0.9, lt) });
    tag(g, 'ちぎった新聞紙', 540, 500, { size: 36, bg: '#2b2f3f', color: '#fff', alpha: inv(1.8, 2.2, lt) });
  } },
  // ── 館内放送
  { at: 'chime', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 820, z: lerp(1.0, 1.1, lt / D) }); speaker(g, { t: lt, on: lt > 0.9 ? 1 : 0 }); g.restore();
    tag(g, '館内放送', 540, 1000, { size: 38, bg: '#ffd451', color: '#1b1b22', alpha: Math.min(inv(0.2, 0.5, lt), 1 - inv(S.L('p2') - 0.2, S.L('p2'), lt)) });
  } },
  // ── 柴田さん安心 / ミオは不安
  { at: 'p3', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 620, y: 1050, z: 1.15 });
    corridor(g, { power: 0, doors: ['3201', '3202', '3203'], stairs: false });
    person(g, P.shiba, { x: 380, y: 1420, s: 1.2, arms: [10, 0, 35, -100], hold: 'flashlight', mouth: 'smile', eyes: 'squint', talk: talking(lt, S, ['p3']), turn: 0.4 });
    person(g, P.koto, { x: 560, y: 1420, s: 1.2, eyes: 'squint', mouth: 'smile', turn: 0.2 });
    person(g, P.mio, { x: 860, y: 1420, s: 1.2, turn: -0.4, brow: -1, mouth: 'frown', lookX: -0.5, hold: 'phoneLight', arms: [10, 0, 20, -90], blink: blinkAt(lt, 1) });
    g.restore();
    darkness(g, 0.36, '#04060c', [{ x: 420, y: 820, r: 700, color: 'rgba(255,230,180,1)', glow: 0.2 }]);
  } },
  // ── 30分で45階は無理
  { at: 'p5', draw(g, lt, D, S) {
    paper(g);
    head(g, '地震から30分', 220);
    const sec = section(g, { cx: 400, top: 330, bot: 1480, w: 330, floors: 45 });
    for (let f = 1; f <= 45; f += 1) { const ok = f <= Math.floor(easeOut(inv(0.5, D, lt)) * 4); if (ok) tag(g, '✓', 610, sec.y(f), { size: 16, bg: '#5f9e6a', color: '#fff', pad: 6 }); }
    const a = inv(S.L('p5') + 0.4, S.L('p5') + 0.9, lt);
    text(g, '45階分の配管', 800, 760, { size: 44, color: '#2b2530', alpha: a });
    text(g, '30分で？', 800, 860, { size: 70, color: '#d63a32', alpha: a });
    text(g, '?', 800, 1080, { size: 220, color: rgba('#d63a32', 0.85), alpha: inv(S.L('p5') + 1.4, S.L('p5') + 1.8, lt) });
  } },
  // ── ミオは流さない
  { at: 'p6', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 560, y: 960, z: 1.0 });
    toilet(g, { power: 0.3, bag: 1, paper: 1 });
    person(g, P.mio, { x: 870, y: 1500, s: 1.25, turn: -0.7, lookX: -1, brow: 0.6, mouth: 'line', arms: [10, 0, lerp(-100, -20, ease(inv(0.3, 1.0, lt))), -20], hold: null, blink: blinkAt(lt) });
    g.restore();
    darkness(g, 0.32, '#04060c', [phoneLight(700, 900, 800)]);
  } },
  // ── 信じた部屋はひとつやふたつではない（外観）
  { at: 'p7', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1000, z: 1.0 });
    sky(g, { dark: 0.9 });
    skyline(g, { y: 1600, dark: 0.99, seed: 4, scale: 0.9, color: '#0e1222', density: 0.5 });
    const T = tower(g, { cx: 540, base: 1700, top: 220, w: 460, wt: 380, floors: 30, dark: 0.85, emergency: 1, cols: 8 });
    const R = rng(31); const n = Math.floor(easeOut(inv(0.3, D - 0.2, lt)) * 70);
    for (let i = 0; i < n; i++) { const f = 1 + Math.floor(R() * 28), c = Math.floor(R() * 8); const k = (f - 0.5) / 30; const ww = lerp(460, 380, k); const x = 540 - ww / 2 + (c + 0.5) * ww / 8, y = T.floorY(f); circ(g, x, y, 13, '#5aa7d6'); g.lineWidth = 3; g.strokeStyle = '#fff'; g.beginPath(); g.arc(x, y, 7, 0, 4.5); g.stroke(); }
    g.restore();
    tag(g, 'ジャーッ', 540, 300, { size: 40, bg: '#5aa7d6', color: '#fff', alpha: inv(0.4, 0.8, lt) });
  } },
  // ── 下の階で悲鳴
  { at: 'p8', finish: { vignette: 0.6 }, draw(g, lt, D, S) {
    const scream = lt > S.L('p9');
    const sh = shake(lt, scream ? 10 : 0);
    g.save(); cam(g, { x: 540, y: 980, z: 1.05, ...sh });
    toilet(g, { power: 0.3 });
    // あふれる汚水
    const k = ease(inv(0.4, D, lt));
    g.save(); g.globalAlpha = 0.9; ell(g, 540, 1040, 255, 115, '#6e4a26'); ell(g, 540, 1500, 120 + k * 600, 40 + k * 180, '#6e4a26'); g.restore();
    for (let i = 0; i < 4; i++) { const p = (lt * 1.6 + i / 4) % 1; circ(g, 260 + i * 180, lerp(-20, 900, p), 14, '#6e4a26'); }
    // 天井のしみ
    ell(g, 540, -20, 200 + k * 300, 60 + k * 120, rgba('#6e4a26', 0.8));
    person(g, P.tenant2, { x: 860, y: 1560, s: 1.2, turn: -0.6, eyes: 'wide', brow: -1, mouth: scream ? 'shout' : 'o', arms: [140, 40, 140, 40] });
    g.restore();
    darkness(g, 0.36, '#0a0405', [{ x: 600, y: 900, r: 800, a: 0.7 }]);
    tag(g, '12階', 540, 300, { size: 40, bg: '#2b2f3f', color: '#fff', alpha: inv(0.2, 0.5, lt) });
    if (scream) { g.fillStyle = `rgba(180,20,20,${0.25 * Math.max(0, 1 - (lt - S.L('p9')) * 1.5)})`; g.fillRect(0, 0, W, H); }
  } },
  // ── 午後10時 ノック
  { at: 'k1', draw(g, lt, D, S) {
    const kb = S.L('knock2');
    const kn = [0.05, 0.32, 0.6].some(x => lt > kb + x && lt < kb + x + 0.1) ? 1 : 0;
    g.save(); cam(g, { x: 540, y: 820, z: lerp(1.0, 1.12, lt / D), sx: kn * 8 });
    doorInside(g, { shakeX: kn * 6, chain: 1 });
    g.restore();
    darkness(g, 0.49, '#04060c', [{ x: 540, y: 1700, r: 900, color: 'rgba(255,236,200,1)', glow: 0.15 }]);
  } },
  // ── ドアスコープの向こう
  { at: 'k2', noFinish: false, draw(g, lt, D, S) { peep(g, lt, S, { z: lerp(1, 1.08, lt / D) }); } },
  { at: 'k4', draw(g, lt, D, S) { peep(g, lt + 3, S, { z: lerp(1.1, 1.3, ease(lt / D)), tagA: inv(0.6, 1.0, lt) }); } },
  // ── チェーンを外さない
  { at: 'k5', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 820, y: 800, z: 2.3 });
    doorInside(g, { chain: 1 });
    hand(g, 830 + Math.sin(lt * 9) * 2, 870, 0.55, { plaster: false, rot: -0.3 });
    g.restore();
    darkness(g, 0.43, '#04060c', [phoneLight(600, 1300, 900)]);
  } },
  // ── ミオ「明日にしてください」
  { at: 'k6', draw(g, lt, D, S) {
    vgrad(g, 0, 0, W, H, [[0, '#1d1f2a'], [1, '#0d0e14']]);
    g.save(); cam(g, { x: 540, y: 900, z: lerp(1.0, 1.08, lt / D) });
    bust(g, P.mio, { x: 540, y: 820, s: 3.3, eyes: 'dot', brow: -1, mouth: 'line', talk: talking(lt, S, ['k6']) * 0.5, sweat: lt * 0.4, turn: 0.15, lookX: 0.6 });
    g.restore();
    darkness(g, 0.4, '#04060c', [phoneLight(540, 1250, 800)]);
  } },
  { at: 'k7', draw(g, lt, D, S) { peep(g, lt + 6, S, { z: 1.12, nod: inv(0.1, 0.6, lt), leave: inv(1.0, D, lt) }); } },
  // ── 足音が遠ざかる（廊下）
  { at: 'steps', draw(g, lt, D, S) {
    const k = clamp(lt / D);
    g.save(); cam(g, { x: 1500, y: 1000, z: 0.85 });
    corridor(g, { power: 0, doors: ['3201', '3202', '3203', '3204'] });
    person(g, P.man, { x: lerp(1250, 1980, k), y: 1420, s: 1.15, turn: 0.9, walk: lt * 1.6, arms: [10, 0, -20, 0], showPlaster: false });
    g.restore();
    darkness(g, 0.45, '#04060c', [{ x: 1080 - 240, y: 600, r: 520, color: 'rgba(90,255,150,1)', glow: 0.3 }, { x: 540, y: 1000, r: 900, a: 0.55 }]);
  } },
  // ── あとになって気づいた（ミオ、ドアにもたれる）
  { at: 'k8', draw(g, lt, D, S) {
    g.save(); cam(g, { x: 540, y: 1100, z: lerp(1.0, 1.1, lt / D) });
    doorInside(g, { chain: 1 });
    person(g, P.mio, { x: 540, y: 1560, s: 1.3, crouch: 1, eyes: lt > 1.2 ? 'wide' : 'closed', brow: -1, mouth: lt > 1.2 ? 'o' : 'line', arms: [40, -60, 40, -60], headDy: 20 });
    g.restore();
    darkness(g, 0.43, '#04060c', [phoneLight(540, 1500, 800)]);
  } },
  // ── 32階分の階段
  { at: 'k9', draw(g, lt, D, S) {
    paper(g, { color: '#e7ddc8' });
    head(g, '32階まで 階段で', 220, inv(0, 0.3, lt));
    const fl = 16, top = 330, bot = 1500, fh = (bot - top) / fl;
    for (let f = 0; f < fl; f++) { const y = bot - f * fh; const dir = f % 2 ? 1 : -1; line(g, 540 - dir * 220, y, 540 + dir * 220, y - fh, 14, '#6b5e4a'); line(g, 300, y, 780, y, 3, 'rgba(107,94,74,.25)', 'butt'); }
    tag(g, '1F', 230, bot, { size: 30, bg: '#6b5e4a', color: '#fff' }); tag(g, '32F', 230, top, { size: 30, bg: '#ffd451', color: '#1b1b22' });
    const k = ease(inv(0.2, D, lt)), f = k * fl, fi = Math.min(fl - 1, Math.floor(f)), fr = f - fi, dir = fi % 2 ? 1 : -1;
    const x = 540 - dir * 220 + dir * 440 * fr, y = bot - fi * fh - fr * fh;
    person(g, P.man, { x, y: y - 6, s: 0.42, turn: dir * 0.8, walk: lt * 3, arms: [10, 0, 10, 0], showPlaster: false });
  } },
  // ── 息ひとつ切れていなかった
  { at: 'k10', finish: { vignette: 0.75 }, draw(g, lt, D, S) {
    peep(g, 9, S, { z: lerp(1.35, 2.1, ease(clamp(lt / 2.6))), focusEyes: true, red: inv(0.5, 2.0, lt) });
  } },
  // ── エンドカード
  { at: 'end', noSubs: true, finish: { vignette: 0.6, grainA: 0.1 }, draw(g, lt, D, S) {
    vgrad(g, 0, 0, W, H, [[0, '#0b0d16'], [1, '#05060a']]);
    glow(g, 540, 700, 600, 'rgba(160,30,30,1)', 0.18);
    const a = easeOut(inv(0.0, 0.5, lt));
    text(g, 'タワマン孤島', 540, 420, { size: 64, color: '#b9b2a4', font: SERIF, weight: 700, alpha: a, spacing: 4 });
    text(g, '第1話「流すな」完', 540, 520, { size: 44, color: '#f3efe6', alpha: a });
    const b = easeOut(inv(0.5, 1.0, lt));
    line(g, 340, 610, 740, 610, 3, rgba('#d63a32', b));
    text(g, '次回', 540, 690, { size: 40, color: '#d63a32', alpha: b });
    text(g, '第2話', 540, 770, { size: 52, color: '#f3efe6', alpha: b });
    text(g, '息が切れない男', 540, 880, { size: 96, color: '#f3efe6', font: SERIF, weight: 700, alpha: b, spacing: 6 });
    const c = easeOut(inv(1.6, 2.1, lt));
    tag(g, EPISODE.ask, 540, 1060, { size: 40, bg: '#ffd451', color: '#1b1b22', alpha: c, pad: 30 });
    const d = easeOut(inv(2.2, 2.7, lt));
    text(g, SERIES.account, 540, 1260, { size: 56, color: '#f3efe6', alpha: d, spacing: 8 });
    text(g, 'フォローして次の話を待ってて', 540, 1335, { size: 32, color: '#b9b2a4', alpha: d, weight: 500 });
  } },
];

function easeIn2(k) { return k * k; }

// ドアスコープの魚眼（丸い視界・ゆがみ）
const pc = document.createElement('canvas'); pc.width = 1080; pc.height = 1080; const pg = pc.getContext('2d');
function peep(g, lt, S, { z = 1, tagA = 0, nod = 0, leave = 0, focusEyes = false, red = 0 } = {}) {
  vgrad(g, 0, 0, W, H, [[0, '#07080c'], [1, '#030305']]);
  pg.setTransform(1, 0, 0, 1, 0, 0); pg.clearRect(0, 0, 1080, 1080);
  pg.save(); pg.translate(540, 540); pg.scale(z, z); pg.translate(-540, -540);
  if (focusEyes) { pg.translate(540, 430); pg.scale(1.6, 1.6); pg.translate(-540, -470); }
  // 外の廊下（非常灯で緑がかる）
  vgrad(pg, -300, -300, 1700, 1700, [[0, '#3c4a46'], [1, '#1f2826']]);
  for (const dx of [-260, 900]) { fillRR(pg, dx, 150, 300, 900, 8, '#2c3a44'); fillRR(pg, dx + 110, 70, 110, 44, 8, '#4d5a5a'); }
  vgrad(pg, -300, 900, 1700, 400, [[0, '#2a2622'], [1, '#141210']]);
  // 男（帽子・マスク・作業着）
  const lx = leave * 500;
  pg.save(); pg.translate(lx, 0);
  person(pg, P.man, { x: 540, y: 1190, s: 1.55, turn: leave > 0 ? 0.8 : 0, eyes: 'dot', brow: 0, headDy: nod * 18, arms: [10, 0, 40, -95], hold: 'clipboard', showPlaster: true, walk: leave > 0 ? lt * 1.6 : null });
  pg.restore();
  pg.restore();
  // 魚眼っぽく：中心を拡大して丸く切り抜く
  g.save(); g.beginPath(); g.arc(540, 820, 470, 0, Math.PI * 2); g.clip();
  const sl = 10;
  for (let i = 0; i < sl; i++) {
    const r0 = 470 * (1 - i / sl), r1 = 470 * (1 - (i + 1) / sl);
    const mag = 1 + 0.55 * (i / sl) * (i / sl);
    g.save(); g.beginPath(); g.arc(540, 820, r0, 0, Math.PI * 2); g.clip();
    const sz = 1080 * (0.86 + 0.3 * (i / sl)); g.drawImage(pc, 540 - sz / 2, 820 - sz / 2, sz, sz);
    g.restore();
  }
  const vg = g.createRadialGradient(540, 820, 250, 540, 820, 470); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.85)'); g.fillStyle = vg; g.fillRect(0, 300, W, 1100);
  if (red > 0) { g.fillStyle = `rgba(150,10,10,${0.35 * red})`; g.fillRect(0, 300, W, 1100); }
  g.restore();
  g.lineWidth = 6; g.strokeStyle = 'rgba(180,190,200,.25)'; g.beginPath(); g.arc(540, 820, 470, 0, 7); g.stroke();
  if (tagA > 0) tag(g, '作業着の男', 540, 300, { size: 40, bg: '#2b2f3f', color: '#fff', alpha: tagA });
}

// 時刻チップ
const CHIPS = [
  { at: 'a3', label: '1日目', val: '19:42', dur: 2.6 },
  { at: 'p5', label: '地震から', val: '30分', dur: 2.6 },
  { at: 'k1', label: '1日目', val: '22:00', dur: 1.5 },
];

// 効果音（tools/sfx.py の種類）
const SFX = [
  { at: 'h1', type: 'wind', dur: 7, vol: 0.5 },
  { at: 'h2', off: 0.5, type: 'hit', vol: 0.9 },
  { at: 'title', type: 'impact', vol: 1.0 },
  { at: 'a1', type: 'roomtone', dur: 6, vol: 0.25 },
  { at: 'alert', type: 'alert', dur: 1.6, vol: 0.55 },
  { at: 'q1', type: 'quake', dur: 9.5, vol: 1.0 },
  { at: 'q3', off: 0.15, type: 'scrape', dur: 1.3, vol: 0.8 },
  { at: 'q4', off: 0.55, type: 'powerdown', vol: 0.9 },
  { at: 'e1', off: 0.2, type: 'clunk', vol: 0.8 },
  { at: 'e2', off: 0.3, type: 'ticks', dur: 2.5, vol: 0.4 },
  { at: 'e2:end', off: 0.1, type: 'stamp', vol: 0.8 },
  { at: 'w1', off: 0.5, type: 'faucet', dur: 4.2, vol: 0.6 },
  { at: 'w3', off: 0.3, type: 'zapoff', vol: 0.6 },
  { at: 'w4', type: 'sputter', dur: 2.2, vol: 0.6 },
  { at: 'w4', off: 1.6, type: 'drips', dur: 4, vol: 0.5 },
  { at: 'knock1', type: 'knock', n: 3, vol: 0.95 },
  { at: 's3', off: 1.0, type: 'ding', vol: 0.5 },
  { at: 's6', type: 'hit', vol: 0.5 },
  { at: 'r2', off: 1.0, type: 'splash', vol: 0.6 },
  { at: 'r3', type: 'impact', vol: 0.9 },
  { at: 'r4', off: 0.3, type: 'rustle', dur: 1.0, vol: 0.6 },
  { at: 'r4', off: 1.6, type: 'tear', dur: 1.6, vol: 0.5 },
  { at: 'chime', type: 'chime', vol: 0.7 },
  { at: 'p7', off: 0.5, type: 'flushes', dur: 3.5, vol: 0.5 },
  { at: 'p8', off: 0.4, type: 'drips', dur: 4, vol: 0.6 },
  { at: 'p9', type: 'hit', vol: 0.7 },
  { at: 'knock2', type: 'knock', n: 3, vol: 1.0 },
  { at: 'k5', type: 'chain', vol: 0.6 },
  { at: 'k6', type: 'heartbeat', dur: 3.6, vol: 0.55 },
  { at: 'steps', type: 'steps', dur: 1.8, vol: 0.6 },
  { at: 'k10', off: 0.1, type: 'stinger', vol: 1.0 },
  { at: 'end', off: 0.1, type: 'impact', vol: 0.8 },
];
// BGM（区間ごとの雰囲気）
const MUSIC = [
  { at: 'h1', mood: 'dread' },
  { at: 'title', mood: 'silence' },
  { at: 'a1', mood: 'calm' },
  { at: 'a3', off: 0.6, mood: 'silence' },
  { at: 'q1', mood: 'tension' },
  { at: 'knock1', mood: 'silence' },
  { at: 's2', mood: 'uneasy' },
  { at: 'r3', mood: 'silence' },
  { at: 'r4', mood: 'uneasy' },
  { at: 'chime', mood: 'silence' },
  { at: 'p3', mood: 'mystery' },
  { at: 'p8', mood: 'dread' },
  { at: 'k1', mood: 'suspense' },
  { at: 'k10', mood: 'silence' },
  { at: 'end', off: 0.6, mood: 'ending' },
];

runEpisode({ SERIES, EPISODE, CAST, LINES, SHOTS, SFX, MUSIC, CHIPS });
