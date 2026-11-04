// 「置き配」の場面：段ボールと伝票、真上から撮られた寝顔の写真、203号室（夜・朝）、天井の点検口と隠されたスマホ、
//   アパートの廊下と玄関、1階の郵便受け、管理会社の鍵の金庫、防犯カメラの白黒映像、ドアスコープ、チェーンのすき間
// 宅配会社・管理会社は架空。社名もロゴも出さない（伝票は「宅配便」とだけ）
import { W, H, clamp, lerp, inv, ease, easeOut, rng, noise1, rr, fillRR, circ, ell, poly, line, vgrad, glow, rgba, mix, text, darkness, FONT, SERIF } from './core.js';
import { C, toneRect, toneFill, figure, head, close } from './noir.js';

export const O = {
  box: '#b98d5c', box2: '#9a7246', box3: '#7d5a36', tape: '#d9c69e', red: '#d8343f', red2: '#ff5a5f', paper: '#f3efe6',
  night: '#0c1424', night2: '#16223a', night3: '#24324e', wall: '#cfd3d6', door: '#5d6a78', led: '#ff4b3e',
};

// ---------- 人物 ----------
export const OP = {
  mio: { hair: 'bob2', hairC: '#2a201e', top: '#bfb6aa', top2: '#a59c90', bottom: '#3a3e4a', shoes: '#e8e8e8', tall: 0.94, female: true },
  saki: { hair: 'long2', hairC: '#3a2a22', top: '#7d8aa0', top2: '#67748a', bottom: '#2e3240', shoes: '#ddd', tall: 0.93, female: true },
  togawa: { hair: 'parted', hairC: '#8a8580', top: '#55585e', top2: '#45484e', bottom: '#33363c', shoes: '#1a1410', tall: 1.02, glasses: true },
  nagase: { hair: 'messy', hairC: '#17171b', top: '#3c4a40', top2: '#2e3a32', bottom: '#2a2c30', shoes: '#bbb', tall: 1.04 },
  ken: { hair: 'cap', hairC: '#1c1a1c', capC: '#2f5d8a', capMark: '#f2c14e', top: '#2f5d8a', top2: '#264d74', bottom: '#2a2e38', shoes: '#eee', tall: 1.0 },
  kenBare: { hair: 'messy', hairC: '#231c18', top: '#d8d2c6', top2: '#c4bdb0', bottom: '#2a2e38', shoes: '#eee', tall: 1.0 },
};

// 内側の座標（iw×ih）を w×h いっぱいに置く
export function fit(g, w, h, iw, ih, draw) { const s = Math.max(w / iw, h / ih); g.save(); g.translate((w - iw * s) / 2, (h - ih * s) / 2); g.scale(s, s); draw(); g.restore(); }
// 手書きふうの文字（1字ずつ少し傾ける）。style＝'a'（ふつう）| 'b'（見覚えのない字：細く右に倒れる）
export function hand(g, s, x, y, { size = 40, color = '#1b2a4a', seed = 1, style = 'a', align = 'left', alpha = 1 } = {}) {
  const R = rng(seed); g.save(); g.globalAlpha *= alpha;
  g.font = style === 'b' ? `500 ${size}px ${SERIF}` : `700 ${size}px "Noto Sans CJK JP", sans-serif`; g.textBaseline = 'middle'; g.fillStyle = color;
  const ws = [...s].map(ch => g.measureText(ch).width * (style === 'b' ? 1.06 : 0.98)); const tw = ws.reduce((a, b) => a + b, 0);
  let xx = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x;
  [...s].forEach((ch, i) => {
    g.save(); g.translate(xx + ws[i] / 2, y + (R() - 0.5) * size * (style === 'b' ? 0.18 : 0.1));
    g.rotate((R() - 0.5) * (style === 'b' ? 0.3 : 0.12) + (style === 'b' ? 0.12 : 0)); if (style === 'b') g.transform(1, 0, -0.18, 1, 0, 0);
    g.textAlign = 'center'; g.fillText(ch, 0, 0); g.restore(); xx += ws[i];
  });
  g.restore();
}

// ---------- 段ボール（x,y＝底の中心、s＝大きさ）。open 0..1 でふたが開く。label＝伝票を貼る ----------
export function cardboard(g, x, y, s = 1, { open = 0, label = true, tilt = 0, shade = 0, to = '相沢ミオ 様' } = {}) {
  g.save(); g.translate(x, y); g.rotate(tilt); g.scale(s, s);
  ell(g, 0, 6, 250, 34, 'rgba(0,0,0,.35)');
  const fw = 360, fh = 230, dx = 90, dy = 70; // 正面の幅・高さ、奥行き
  // 側面（右）
  poly(g, [[fw / 2, 0], [fw / 2 + dx, -dy], [fw / 2 + dx, -dy - fh], [fw / 2, -fh]], O.box3);
  // 正面
  fillRR(g, -fw / 2, -fh, fw, fh, 4, O.box2);
  toneRect(g, -fw / 2, -fh, fw, fh, 'rgba(60,40,20,.18)', 8, 1.6);
  // 天面
  if (open < 0.05) {
    poly(g, [[-fw / 2, -fh], [fw / 2, -fh], [fw / 2 + dx, -fh - dy], [-fw / 2 + dx, -fh - dy]], O.box);
    // ガムテープ（天面の真ん中から正面へ）
    poly(g, [[-26 + dx / 2, -fh - dy / 2], [26 + dx / 2, -fh - dy / 2], [26, -fh], [-26, -fh]], O.tape);
    poly(g, [[-fw / 2 + dx / 2, -fh - dy / 2 - 3], [fw / 2 + dx / 2, -fh - dy / 2 - 3], [fw / 2 + dx / 2, -fh - dy / 2 + 3], [-fw / 2 + dx / 2, -fh - dy / 2 + 3]], 'rgba(90,60,30,.5)');
    fillRR(g, -26, -fh, 52, 60, 0, O.tape);
  } else {
    // 中（暗い）とふた
    poly(g, [[-fw / 2, -fh], [fw / 2, -fh], [fw / 2 + dx, -fh - dy], [-fw / 2 + dx, -fh - dy]], '#2a1c10');
    const k = ease(clamp(open));
    poly(g, [[-fw / 2, -fh], [fw / 2, -fh], [fw / 2 - 10, -fh + lerp(-dy / 2, 70, k)], [-fw / 2 + 10, -fh + lerp(-dy / 2, 70, k)]], O.box); // 手前のふた（前に倒れる）
    poly(g, [[-fw / 2 + dx, -fh - dy], [fw / 2 + dx, -fh - dy], [fw / 2 + dx + 10, -fh - dy - lerp(dy / 2, 120, k)], [-fw / 2 + dx - 10, -fh - dy - lerp(dy / 2, 120, k)]], O.box3); // 奥のふた
    if (k > 0.5) { g.save(); g.globalAlpha = (k - 0.5) * 2; fillRR(g, -60 + dx / 2, -fh - dy / 2 - 30, 150, 60, 4, '#efe9dc'); g.restore(); } // 中の写真の白いふち
  }
  // 伝票
  if (label) {
    fillRR(g, -fw / 2 + 30, -fh + 48, 190, 130, 3, O.paper);
    g.lineWidth = 2; g.strokeStyle = rgba(O.red, 0.9); for (let i = 0; i < 4; i++) line(g, -fw / 2 + 40, -fh + 78 + i * 24, -fw / 2 + 210, -fh + 78 + i * 24, 2, rgba(O.red, 0.7));
    fillRR(g, -fw / 2 + 30, -fh + 48, 190, 22, 3, O.red);
    hand(g, to, -fw / 2 + 44, -fh + 96, { size: 20, seed: 4 });
  }
  if (shade) { g.save(); g.globalAlpha = shade; poly(g, [[-fw / 2, 0], [fw / 2, 0], [fw / 2 + dx, -dy], [fw / 2 + dx, -dy - fh], [-fw / 2 + dx, -fh - dy], [-fw / 2, -fh]], '#000'); g.restore(); }
  g.restore();
}

// ---------- 伝票の寄り（w×h の中に描く）。hi＝'to'|'from' を赤丸で囲む ----------
function contain(g, w, h, iw, ih, draw) { const s = Math.min(w / iw, h / ih); g.save(); g.translate((w - iw * s) / 2, (h - ih * s) / 2); g.scale(s, s); draw(); g.restore(); }
export function waybill(g, w, h, { to = '相沢ミオ', toAddr = '白樺町3-8 コーポ白樺 203', from = '', fromAddr = '白樺町3-8 コーポ白樺 203', item = '写真', date = '11月5日', hi = '', hiK = 1, style = 'a', fromName = '' } = {}) {
  contain(g, w, h, 1000, 700, () => {
    g.fillStyle = '#8a6440'; g.fillRect(0, 0, 1000, 700); toneRect(g, 0, 0, 1000, 700, 'rgba(60,40,20,.2)', 9, 2);
    g.save(); g.translate(500, 350); g.rotate(-0.025);
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 20; fillRR(g, -440, -300, 880, 600, 6, O.paper); g.shadowColor = 'transparent';
    fillRR(g, -440, -300, 880, 70, 6, O.red); g.fillStyle = O.red; g.fillRect(-440, -250, 880, 20);
    text(g, '宅配便', -400, -264, { size: 36, color: '#fff', align: 'left', weight: 900, spacing: 6 });
    text(g, '置き配', 400, -264, { size: 30, color: '#fff', align: 'right', weight: 800 });
    const row = (y, lab, addr, name, key) => {
      g.lineWidth = 3; g.strokeStyle = rgba(O.red, 0.85); g.strokeRect(-420, y, 840, 190);
      fillRR(g, -420, y, 120, 190, 0, rgba(O.red, 0.12)); text(g, lab, -360, y + 95, { size: 30, color: O.red, weight: 900 });
      line(g, -420 + 120, y, -420 + 120, y + 190, 3, rgba(O.red, 0.85));
      text(g, '住所', -280, y + 30, { size: 20, color: rgba(O.red, 0.9), align: 'left', weight: 700 });
      text(g, 'お名前', -280, y + 115, { size: 20, color: rgba(O.red, 0.9), align: 'left', weight: 700 });
      if (addr) hand(g, addr, -270, y + 68, { size: 38, seed: key.length * 7 + 3, style });
      if (name) hand(g, name, -270, y + 152, { size: 52, seed: key.length * 11 + 5, style });
      if (hi === key && hiK > 0) { g.save(); g.globalAlpha = hiK; g.lineWidth = 9; g.strokeStyle = O.red2; g.beginPath(); g.ellipse(80, y + 95 + (key === 'from' && !name ? -27 : 0), 400 * easeOut(clamp(hiK * 1.3)), 88, -0.03, 0, 7); g.stroke(); g.restore(); }
    };
    row(-210, 'お届け先', toAddr, to ? `${to}　様` : '', 'to');
    row(10, 'ご依頼主', fromAddr, fromName, 'from');
    text(g, `品名　${item}`, -410, 240, { size: 28, color: '#4a3a3a', align: 'left', weight: 700 });
    text(g, `${date}　午前着`, 410, 240, { size: 28, color: '#4a3a3a', align: 'right', weight: 700 });
    g.restore();
  });
}

// ---------- 真上から撮られた写真（w×h）。who='mio'|'saki'|'none'、bright＝明るくする（暗がりの男が見える）、man＝男がいるか ----------
// mode='sleep'（寝顔）| 'empty'（誰もいない昼の部屋）| 'desk'（仕事中）
export function topPhoto(g, w, h, { who = 'mio', mode = 'sleep', date = '2026.11.05', time = '3:12', bright = 0, man = 1, manFace = 0, t = 0, stamp = true, cam = 0 } = {}) {
  const day = mode !== 'sleep';
  fit(g, w, h, 1000, 750, () => {
    // 床
    vgrad(g, 0, 0, 1000, 750, day ? [[0, '#a7a49c'], [1, '#8c897f']] : [[0, '#1a2436'], [1, '#101826']]);
    g.save(); g.globalAlpha = 0.25; for (let i = 0; i < 9; i++) line(g, -40 + i * 130, 0, 60 + i * 130, 750, 3, day ? '#6a675f' : '#0a101c'); g.restore();
    // ラグ
    if (who !== 'saki') fillRR(g, 40, 430, 300, 260, 20, day ? '#c9b8a0' : '#2a3044'); else fillRR(g, 40, 430, 300, 260, 140, day ? '#a0b0a0' : '#283a34');
    // ベッド（右寄り、上が枕）
    fillRR(g, 400, 40, 520, 760, 14, day ? '#7a6a5a' : '#1c2030');
    fillRR(g, 416, 56, 488, 740, 10, day ? '#eae6de' : '#3a4866');
    // 枕
    fillRR(g, 450, 80, 420, 130, 40, day ? '#f6f3ee' : '#56688c');
    // 掛け布団
    const quilt = who === 'saki' ? (day ? '#d6c4c4' : '#4a4458') : (day ? '#b8c4d6' : '#3c4c70');
    if (mode === 'sleep') {
      fillRR(g, 410, 260, 500, 540, 30, quilt);
      g.save(); g.globalAlpha = 0.35; for (let i = 0; i < 6; i++) line(g, 430, 300 + i * 80, 890, 320 + i * 80, 3, '#1a2034'); g.restore();
      // 寝顔（少し横を向いて）
      const P = who === 'saki' ? OP.saki : OP.mio;
      g.save(); g.translate(640, 175); g.rotate(-0.25); close(g, { ...P, top: quilt, top2: quilt }, { x: 0, y: 0, s: 0.95, eyes: 'closed', mouth: 'line', lightFrom: 'right' }); g.restore();
      fillRR(g, 410, 268, 500, 540, 30, quilt); // 肩を布団で隠す
      g.save(); g.globalAlpha = 0.35; for (let i = 0; i < 6; i++) line(g, 430, 300 + i * 80, 890, 320 + i * 80, 3, '#1a2034'); g.restore();
    } else {
      fillRR(g, 560, 300, 330, 470, 30, quilt); // たたんだ布団
    }
    // 机（左上）とパソコン
    fillRR(g, 30, 30, 330, 200, 6, day ? '#9a7a5a' : '#2a2a34');
    fillRR(g, 110, 60, 180, 120, 6, '#2a2c33'); fillRR(g, 118, 68, 164, 104, 4, day ? '#7aa0c8' : '#1a2a44');
    if (mode === 'desk') { // 机に向かうミオ（真上から：頭と肩）
      ell(g, 200, 300, 120, 70, OP.mio.top); circ(g, 200, 270, 62, OP.mio.hairC); ell(g, 200, 250, 50, 40, '#3a2e2a');
      line(g, 120, 290, 150, 200, 30, OP.mio.top2); line(g, 280, 290, 250, 200, 30, OP.mio.top2); circ(g, 150, 196, 16, C.skin); circ(g, 250, 196, 16, C.skin);
    }
    // ドア側（左下）の暗がりに立つ男：戸川（上から見下ろす）。manFace＝顔を上げてカメラを見る
    if (mode === 'sleep' && man) {
      ell(g, 220, 585, 135, 88, OP.togawa.top); toneRect(g, 85, 500, 135, 170, 'rgba(0,0,0,.25)', 8, 2);
      line(g, 300, 560, 420, 450, 34, OP.togawa.top2); circ(g, 428, 442, 18, C.skin); // ベッドへのばした腕
      line(g, 440, 430, 447, 402, 4, '#c9ced4'); fillRR(g, 436, 370, 22, 40, 4, O.red); // 赤い札の鍵
      if (manFace) close(g, OP.togawa, { x: 220, y: 500, s: 0.8, eyes: 'normal', lookY: -1, mouth: 'line', lightFrom: 'right' });
      else { circ(g, 220, 510, 72, OP.togawa.hairC); line(g, 190, 450, 250, 560, 4, 'rgba(60,56,52,.6)'); ell(g, 150, 520, 12, 18, C.skin); ell(g, 290, 520, 12, 18, C.skin); line(g, 150, 505, 170, 470, 4, '#2a2420'); line(g, 290, 505, 270, 470, 4, '#2a2420'); }
    }
    if (mode === 'sleep') { // 暗がり（bright で明るくすると男が見える）。赤い札だけ、かすかに残る
      const k = clamp(bright);
      const gr = g.createRadialGradient(240, 520, 0, 240, 520, 330); gr.addColorStop(0, `rgba(2,4,10,${lerp(0.95, 0, k)})`); gr.addColorStop(0.75, `rgba(2,4,10,${lerp(0.9, 0, k)})`); gr.addColorStop(1, 'rgba(2,4,10,0)');
      g.fillStyle = gr; g.fillRect(-100, 150, 700, 700);
      if (man && k < 1) { g.save(); g.globalAlpha = 0.32 * (1 - k); fillRR(g, 436, 370, 22, 40, 4, O.red); g.restore(); }
    }
  });
  // 暗さは画面座標で重ねる（fit の外で、写真の範囲だけ）
  if (!day) {
    g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip();
    const k = clamp(bright);
    const gr = g.createRadialGradient(w * 0.64, h * 0.24, 0, w * 0.64, h * 0.3, w * 0.62);
    gr.addColorStop(0, `rgba(2,4,10,${lerp(0.15, 0.0, k)})`); gr.addColorStop(0.55, `rgba(2,4,10,${lerp(0.62, 0.12, k)})`); gr.addColorStop(1, `rgba(2,4,10,${lerp(0.97, 0.3, k)})`);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (k > 0) { g.save(); g.globalAlpha = 0.08 * k; const R = rng(3); for (let i = 0; i < 700; i++) { g.fillStyle = R() < 0.5 ? '#fff' : '#000'; g.fillRect(R() * w, R() * h, 2, 2); } g.restore(); }
    g.restore();
  }
  if (stamp) {
    const sz = Math.max(18, w * 0.04);
    text(g, `${date}  ${time}`, w - sz * 0.8, h - sz * 1.0, { size: sz, color: '#ffb36a', align: 'right', weight: 800, stroke: 'rgba(0,0,0,.5)', sw: 4 });
  }
}

// 紙焼きの写真（白いふち）として置く
export function print(g, x, y, w, h, draw, { rot = 0, a = 1, back = false, note = '' } = {}) {
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot);
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 40; fillRR(g, -w / 2 - 22, -h / 2 - 22, w + 44, h + 44, 4, '#f1ece2'); g.shadowColor = 'transparent';
  if (back) { // 写真のうら（手書きのメモ）
    fillRR(g, -w / 2 - 22, -h / 2 - 22, w + 44, h + 44, 4, '#ece6da'); toneRect(g, -w / 2 - 22, -h / 2 - 22, w + 44, h + 44, 'rgba(0,0,0,.05)', 8, 1.5);
    if (note) hand(g, note, 0, 0, { size: Math.min(80, w / (note.length + 1)), align: 'center', seed: 9 });
  } else { g.save(); g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.clip(); g.translate(-w / 2, -h / 2); draw(g, w, h); g.restore(); }
  g.restore();
}

// ---------- 203号室（引きの絵）。night 0..1、hatch＝点検口のずれ、blink＝すき間の光、mio＝立つミオ {x,y,s,...} ----------
export function room203(g, { t = 0, night = 1, hatch = 0.12, blink = 0, mio = null, lamp = 0, bedMio = 0, flash = null, chair = 0, hatchOpen = 0 } = {}) {
  const N = night;
  const wallC = mix('#c9c6bd', '#1a2438', N), ceilC = mix('#dedbd2', '#1f2a40', N), floorC = mix('#a08a6c', '#141c2c', N);
  vgrad(g, -300, -300, W + 600, H + 600, [[0, mix('#d8d5cc', '#121a2c', N)], [1, mix('#b7b2a6', '#0c1220', N)]]);
  // 天井（台形）
  poly(g, [[-300, -300], [1380, -300], [960, 360], [120, 360]], ceilC);
  // 照明（天井の真ん中）
  ell(g, 470, 140, 120, 30, mix('#f4f1ea', '#3a4664', N)); ell(g, 470, 132, 90, 18, mix('#ffffff', '#4a5878', N));
  // 点検口（ベッドの真上・右奥）
  const hx = 720, hy = 260;
  poly(g, [[hx - 110, hy - 40], [hx + 110, hy - 40], [hx + 130, hy + 30], [hx - 120, hy + 30]], mix('#c4c0b6', '#18223a', N));
  g.lineWidth = 3; g.strokeStyle = mix('#9a968c', '#0e1628', N); g.beginPath(); g.moveTo(hx - 110, hy - 40); g.lineTo(hx + 110, hy - 40); g.lineTo(hx + 130, hy + 30); g.lineTo(hx - 120, hy + 30); g.closePath(); g.stroke();
  if (hatchOpen > 0) poly(g, [[hx - 110, hy - 40], [hx + 110, hy - 40], [hx + 130, hy + 30], [hx - 120, hy + 30]], '#020306');
  else if (hatch > 0) { poly(g, [[hx + 110 - 30 * hatch * 4, hy - 40], [hx + 110, hy - 40], [hx + 130, hy + 30], [hx + 130 - 34 * hatch * 4, hy + 30]], '#05070c'); }
  if (blink > 0 && Math.sin(t * 5) > 0) { circ(g, hx + 116, hy - 6, 5, O.led); glow(g, hx + 116, hy - 6, 40, 'rgba(255,70,60,1)', 0.7 * blink); }
  // 奥の壁
  fillRR(g, 120, 360, 840, 800, 0, wallC);
  toneRect(g, 120, 360, 840, 800, 'rgba(0,0,0,.12)', 9, 2);
  // 窓とカーテン（左）
  fillRR(g, 170, 440, 300, 470, 4, mix('#e8eef4', '#2a3c5c', N));
  if (N > 0.5) glow(g, 320, 600, 300, 'rgba(140,170,230,1)', 0.25 * N);
  fillRR(g, 150, 420, 80, 520, 10, mix('#9aa6b4', '#2a3450', N)); fillRR(g, 410, 420, 80, 520, 10, mix('#9aa6b4', '#2a3450', N));
  // クローゼット（右）
  fillRR(g, 700, 420, 230, 740, 4, mix('#d8d2c4', '#202a40', N)); line(g, 815, 430, 815, 1150, 3, mix('#a8a294', '#121a2c', N));
  circ(g, 800, 800, 8, mix('#8a8478', '#0c1220', N)); circ(g, 830, 800, 8, mix('#8a8478', '#0c1220', N));
  // 床
  poly(g, [[120, 1160], [960, 1160], [1380, 2300], [-300, 2300]], floorC);
  g.save(); g.globalAlpha = 0.22; for (let i = 0; i < 9; i++) line(g, 120 + i * 105, 1160, -300 + i * 210, 2300, 3, '#000'); g.restore();
  // 机とパソコン（左手前）
  fillRR(g, -60, 1080, 380, 40, 4, mix('#8a6a4a', '#1e1a24', N)); line(g, 0, 1120, 0, 1400, 20, mix('#6a5038', '#14121a', N)); line(g, 280, 1120, 280, 1400, 20, mix('#6a5038', '#14121a', N));
  fillRR(g, 40, 900, 230, 170, 8, '#22242a'); fillRR(g, 52, 912, 206, 146, 4, mix('#8ab0d8', '#24385a', N)); fillRR(g, 130, 1068, 50, 14, 2, '#22242a');
  // ベッド（右奥、壁ぎわ）
  poly(g, [[560, 1040], [960, 1040], [1120, 1500], [480, 1500]], mix('#e8e4dc', '#34405e', N));
  fillRR(g, 560, 960, 400, 90, 10, mix('#7a6a5a', '#1a1e2e', N)); // ヘッドボード
  ell(g, 760, 1070, 150, 40, mix('#f6f3ee', '#4c5c80', N)); // 枕
  poly(g, [[520, 1160], [1000, 1160], [1120, 1500], [480, 1500]], mix('#b8c4d6', '#3c4c70', N)); // 掛け布団
  if (bedMio) { g.save(); g.translate(760, 1080); close(g, { ...OP.mio, top: mix('#b8c4d6', '#3c4c70', N), top2: mix('#b8c4d6', '#3c4c70', N) }, { x: 0, y: 0, s: 0.5, eyes: bedMio > 1 ? 'normal' : 'closed', lightFrom: 'right', look: 0, lookY: -1 }); g.restore(); poly(g, [[520, 1150], [1000, 1150], [1120, 1500], [480, 1500]], mix('#b8c4d6', '#3c4c70', N)); }
  // 椅子（点検口の下）
  if (chair) { fillRR(g, 640, 1180, 180, 30, 6, '#5a4a3a'); line(g, 660, 1210, 650, 1400, 14, '#4a3a2a'); line(g, 800, 1210, 810, 1400, 14, '#4a3a2a'); }
  if (mio) figure(g, OP.mio, { lightFrom: 'left', ...mio });
  if (lamp) glow(g, 155, 980, 400, 'rgba(160,190,255,1)', 0.3 * lamp);
  if (flash) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, flash.x, flash.y, flash.r || 300, 'rgba(255,245,220,1)', flash.a ?? 0.5); g.restore(); }
}

// ---------- 天井の点検口を下から見上げる。gap＝ずれ、blink＝すき間の光、open 0..1、phone＝中のスマホ、flash＝懐中電灯 ----------
export function ceiling(g, { t = 0, gap = 0.2, blink = 1, open = 0, phone = 1, flash = 0, hand = 0, ring = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#1e2a40'], [1, '#141c2e']]);
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(255,255,255,.035)', 10, 2);
  // 天井板の目地
  g.save(); g.globalAlpha = 0.4; for (let i = -2; i < 8; i++) line(g, -300, 120 + i * 300, W + 300, 120 + i * 300, 3, '#0e1626'); g.restore();
  const x0 = 220, y0 = 290, s = 640; // 点検口の枠
  fillRR(g, x0 - 22, y0 - 22, s + 44, s + 44, 6, '#2c3a54'); fillRR(g, x0, y0, s, s, 2, '#05070c');
  if (open < 1) { // ふた（gap で右下にずれる／open で奥へ持ち上がって消える）
    const k = ease(open), dx = gap * 60 + k * 0, sc = lerp(1, 0.7, k);
    g.save(); g.globalAlpha = 1 - k; g.translate(x0 + s / 2 + dx, y0 + s / 2 - k * 60); g.scale(sc, sc);
    fillRR(g, -s / 2, -s / 2, s, s, 4, '#26324a'); toneRect(g, -s / 2, -s / 2, s, s, 'rgba(255,255,255,.04)', 10, 2);
    g.lineWidth = 4; g.strokeStyle = '#34425e'; rr(g, -s / 2 + 20, -s / 2 + 20, s - 40, s - 40, 4); g.stroke();
    circ(g, -s / 2 + 50, 0, 10, '#4a5878');
    g.restore();
  }
  const lit = flash > 0;
  if (open > 0.3) { // 中：梁と線、テープでとめたスマホ（レンズがこちらを見ている）
    g.save(); g.beginPath(); g.rect(x0, y0, s, s); g.clip();
    vgrad(g, x0, y0, s, s, [[0, '#0a0a10'], [1, '#040408']]);
    const wc = lit ? '#6a4c30' : '#24180e';
    fillRR(g, x0 - 20, y0 + 120, s + 40, 70, 0, wc); fillRR(g, x0 + 360, y0 - 20, 80, s + 40, 0, wc);
    g.lineWidth = 8; g.strokeStyle = '#1a1a1a'; g.beginPath(); g.moveTo(x0 + s, y0 + 60); g.bezierCurveTo(x0 + 420, y0 + 200, x0 + 300, y0 + 210, x0 + 300, y0 + 300); g.stroke();
    if (phone) {
      const sh = ring ? noise1(t * 40, 2) * 6 : 0;
      g.save(); g.translate(x0 + 290 + sh, y0 + 360); g.rotate(-0.08);
      fillRR(g, -90, -170, 180, 340, 22, lit ? '#3a3e48' : '#141620'); // 背面
      fillRR(g, -60, -150, 70, 70, 16, lit ? '#22252c' : '#0a0b10'); circ(g, -35, -125, 18, '#0a0c12'); circ(g, -35, -125, 8, '#3a5a8a'); circ(g, -10, -105, 12, '#0a0c12'); // レンズ
      glow(g, -35, -125, 30, 'rgba(120,160,255,1)', 0.4);
      fillRR(g, -110, -40, 220, 50, 4, lit ? '#b8bcc4' : '#3a3c44'); fillRR(g, -110, 80, 220, 44, 4, lit ? '#b8bcc4' : '#3a3c44'); // テープ
      line(g, 0, 170, 10, 230, 8, '#1a1a1a');
      if (ring) { g.save(); g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 14); fillRR(g, -90, -170, 180, 340, 22, 'rgba(120,200,255,.25)'); g.restore(); glow(g, 0, 0, 260, 'rgba(120,200,255,1)', 0.35); }
      g.restore();
      if (blink && Math.sin(t * 5) > 0) { circ(g, x0 + 360, y0 + 470, 7, O.led); glow(g, x0 + 360, y0 + 470, 50, 'rgba(255,70,60,1)', 0.8); }
    }
    g.restore();
  } else if (blink > 0 && gap > 0) { // すき間の奥の光
    if (Math.sin(t * 5) > -0.2) { circ(g, x0 + gap * 30, y0 + s * 0.62, 7, O.led); glow(g, x0 + gap * 30, y0 + s * 0.62, 70, 'rgba(255,70,60,1)', 0.75 * blink); }
  }
  if (lit) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x0 + s / 2, y0 + s / 2, 520, 'rgba(255,240,210,1)', 0.35 * flash); g.restore(); }
  if (hand) { // 下からのばした手と懐中電灯
    g.save(); g.translate(lerp(980, 760, ease(hand)), lerp(1500, 1120, ease(hand))); g.rotate(-0.5);
    fillRR(g, -60, 0, 120, 600, 50, OP.mio.top2); ell(g, 0, -10, 64, 80, C.skin); fillRR(g, -26, -150, 52, 120, 10, '#2a2c32'); g.restore();
  }
}

// ---------- 天井から下ろしたスマホの画面：待ち受け（サキと若い男）、着信 ----------
export function sakiLock(p, w, h, { t = 0, call = 0, clock = '23:41', num = '090-●●●●-0314' } = {}) {
  // 待ち受けの写真：海辺で並ぶ姉と弟（弟は帽子なし）
  vgrad(p, 0, 0, w, h, [[0, '#8fb7d6'], [0.55, '#cfe0e8'], [0.56, '#6a90a8'], [1, '#c9b48a']]);
  const s = w / 800;
  figure(p, OP.saki, { x: w * 0.36, y: h * 1.02, s: 1.25 * s, eyes: 'normal', mouth: 'smile', lightFrom: 'right', arms: [10, 0, 40, -20], shadow: false });
  figure(p, OP.kenBare, { x: w * 0.66, y: h * 1.04, s: 1.3 * s, eyes: 'normal', mouth: 'smile', lightFrom: 'left', arms: [40, -20, 10, 0], turn: -0.2, shadow: false });
  vgrad(p, 0, 0, w, h * 0.4, [[0, 'rgba(0,0,0,.45)'], [1, 'rgba(0,0,0,0)']]);
  text(p, clock, w / 2, h * 0.14, { size: 150 * s, color: '#fff', weight: 500 });
  text(p, '11月9日 月曜日', w / 2, h * 0.055, { size: 34 * s, color: 'rgba(255,255,255,.9)', weight: 600 });
  if (call > 0) {
    p.save(); p.globalAlpha = clamp(call * 2);
    fillRR(p, 0, 0, w, h, 0, 'rgba(8,10,16,.82)');
    const k = (t * 1.2) % 1; p.save(); p.globalAlpha *= 1 - k; p.lineWidth = 6; p.strokeStyle = '#7ce0a0'; p.beginPath(); p.arc(w / 2, h * 0.3, 120 * s + k * 120 * s, 0, 7); p.stroke(); p.restore();
    circ(p, w / 2, h * 0.3, 110 * s, '#3a4458'); text(p, '？', w / 2, h * 0.3 + 4, { size: 110 * s, color: '#dfe6f2', weight: 900 });
    text(p, '着信', w / 2, h * 0.3 + 180 * s, { size: 40 * s, color: '#9aa5bb', weight: 700 });
    text(p, num, w / 2, h * 0.3 + 250 * s, { size: 60 * s, color: '#fff', weight: 800 });
    circ(p, w * 0.28, h * 0.8, 70 * s, '#ff3b4a'); circ(p, w * 0.72, h * 0.8, 70 * s, '#36c26a');
    p.restore();
  }
}

// ---------- 通話中の画面（相手の名前・番号・時間） ----------
export function callView(p, w, h, { t = 0, name = '水野サキ', sub = '通話中', sec = 0, av = 'サ', col = '#7ce0a0' } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#1a2234'], [1, '#0b0f1a']]);
  const s = w / 800;
  circ(p, w / 2, h * 0.28, 120 * s, '#3a4458'); text(p, av, w / 2, h * 0.28 + 6, { size: 110 * s, color: '#dfe6f2', weight: 900 });
  text(p, name, w / 2, h * 0.28 + 200 * s, { size: 64 * s, color: '#fff', weight: 800 });
  text(p, `${sub}　${Math.floor((sec + t) / 60)}:${String(Math.floor((sec + t) % 60)).padStart(2, '0')}`, w / 2, h * 0.28 + 275 * s, { size: 36 * s, color: col, weight: 700 });
  p.save(); p.lineWidth = 5; p.strokeStyle = col; p.beginPath(); for (let k = 0; k <= 60; k++) { const x = w * 0.15 + k * w * 0.0117, a = Math.sin(k * 0.7 + t * 10) * 30 * s * Math.abs(noise1(t * 3 + k * 0.2, 2)); k ? p.lineTo(x, h * 0.62 + a) : p.moveTo(x, h * 0.62 + a); } p.stroke(); p.restore();
  circ(p, w / 2, h * 0.84, 72 * s, '#ff3b4a'); fillRR(p, w / 2 - 34 * s, h * 0.84 - 9 * s, 68 * s, 18 * s, 9 * s, '#fff');
}

// ---------- 写真アプリで写真を明るくする画面 ----------
export function editView(p, w, h, { t = 0, bright = 0, img } = {}) {
  vgrad(p, 0, 0, w, h, [[0, '#0b0c10'], [1, '#08090c']]);
  const s = w / 800;
  text(p, '編集', w / 2, 70 * s, { size: 34 * s, color: '#fff', weight: 700 });
  const ph = w * 0.75 * 1.0; p.save(); p.translate(0, 130 * s); p.beginPath(); p.rect(0, 0, w, ph); p.clip(); img(p, w, ph, bright); p.restore();
  const y = 130 * s + ph + 120 * s;
  text(p, '明るさ', 70 * s, y - 50 * s, { size: 30 * s, color: '#c9ccd6', align: 'left', weight: 700 });
  text(p, `+${Math.round(bright * 100)}`, w - 70 * s, y - 50 * s, { size: 30 * s, color: '#ffd451', align: 'right', weight: 800 });
  fillRR(p, 70 * s, y, w - 140 * s, 10 * s, 5 * s, '#3a3e48'); fillRR(p, 70 * s, y, (w - 140 * s) * bright, 10 * s, 5 * s, '#ffd451');
  circ(p, 70 * s + (w - 140 * s) * bright, y + 5 * s, 22 * s, '#fff');
  // 太陽のアイコン
  const cy = y + 140 * s; circ(p, w / 2, cy, 36 * s, '#ffd451'); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; line(p, w / 2 + Math.cos(a) * 52 * s, cy + Math.sin(a) * 52 * s, w / 2 + Math.cos(a) * 68 * s, cy + Math.sin(a) * 68 * s, 6 * s, '#ffd451'); }
}

// ---------- 2階の廊下・203のドアの前（正面）。morning 0..1、box＝ドアの前の段ボール、plate＝部屋番号 ----------
export function doorFront(g, { t = 0, morning = 1, box = 1, boxOpen = 0, plate = '203', doorC = O.door, people = null, night = 0, neighbor = true, dawn = 0 } = {}) {
  const N = night;
  vgrad(g, -300, -300, W + 600, H + 600, [[0, mix('#dfe2e4', '#141a26', N)], [1, mix('#c4c8cc', '#0c1018', N)]]);
  // 外壁
  fillRR(g, -300, 120, W + 600, 1460, 0, mix('#d8d8d2', '#262c38', N)); toneRect(g, -300, 120, W + 600, 1460, 'rgba(0,0,0,.08)', 10, 2.2);
  // 上の階の床（天井）
  fillRR(g, -300, 60, W + 600, 90, 0, mix('#b8b8b2', '#1a1e28', N));
  // 天井の廊下灯
  ell(g, 540, 160, 70, 18, mix('#f4f1ea', '#ffe9b8', N)); if (N > 0.3) glow(g, 540, 180, 600, 'rgba(255,230,180,1)', 0.35 * N);
  // 隣の202のドア（左の端）
  if (neighbor) { fillRR(g, -250, 380, 300, 1180, 6, mix('#7a8490', '#2a3240', N)); fillRR(g, -230, 400, 260, 1140, 4, mix('#6a7480', '#222a36', N)); text(g, '202', -100, 340, { size: 40, color: mix('#5a5e66', '#8a90a0', N), weight: 800 }); circ(g, 0, 1000, 14, '#b9bcc2'); }
  // 203のドア
  fillRR(g, 280, 330, 520, 1250, 8, mix('#8a9098', '#1a1e26', N)); // 枠
  fillRR(g, 300, 350, 480, 1230, 4, mix(doorC, '#2a3444', N));
  toneRect(g, 300, 350, 480, 1230, 'rgba(0,0,0,.12)', 10, 2.2);
  fillRR(g, 470, 250, 140, 60, 6, mix('#efece4', '#3a4050', N)); text(g, plate, 540, 282, { size: 40, color: mix('#3a3e46', '#c9ccd6', N), weight: 800 });
  circ(g, 540, 700, 14, '#1a1c22'); circ(g, 540, 700, 6, '#5a5e66'); // ドアスコープ
  fillRR(g, 700, 940, 46, 130, 14, '#b9bcc2'); fillRR(g, 706, 1100, 34, 34, 6, '#8a8e96'); // ノブと鍵穴
  fillRR(g, 680, 1130, 80, 16, 3, '#9a9ea6');
  // 新聞受け
  fillRR(g, 420, 1250, 240, 50, 6, mix('#7a828c', '#1a202a', N));
  // インターホン（右）
  fillRR(g, 860, 760, 110, 170, 12, mix('#efece4', '#3a4050', N)); circ(g, 915, 880, 24, mix('#c9c4ba', '#555555', N)); circ(g, 915, 800, 14, '#2a2c32');
  // 床と手すりの影
  vgrad(g, -300, 1580, W + 600, 700, [[0, mix('#a8aaa6', '#1a1e28', N)], [1, mix('#8a8c88', '#0a0c12', N)]]);
  if (morning > 0 && N < 0.5) { g.save(); g.globalAlpha = 0.18 * morning; for (let i = 0; i < 10; i++) poly(g, [[-300 + i * 160, 1580], [-260 + i * 160, 1580], [-180 + i * 160 + 300, 2300], [-220 + i * 160 + 300, 2300]], '#3a3c40'); g.restore(); glow(g, 0, 700, 900, 'rgba(255,246,226,1)', 0.25 * morning); }
  if (dawn) glow(g, 0, 400, 1000, 'rgba(255,200,170,1)', 0.25 * dawn);
  if (people) people(g);
  if (box) cardboard(g, 520, 1680, 1.05, { open: boxOpen });
}

// ---------- 防犯カメラの白黒映像（w×h）。廊下を上から。draw＝人を描く(q,w,h) ----------
export function secCam(g, w, h, { t = 0, draw = null, clock = '2026/11/06 05:52:14', cam = 'CAM 2　2F廊下', box = 1 } = {}) {
  g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip();
  fit(g, w, h, 1000, 750, () => {
    vgrad(g, 0, 0, 1000, 750, [[0, '#5a5e60'], [1, '#2a2c2e']]);
    // 奥へのびる廊下（左：手すり、右：ドア）
    poly(g, [[0, 750], [1000, 750], [640, 120], [380, 120]], '#6a6c6a');
    poly(g, [[0, 750], [380, 120], [360, 120], [0, 520]], '#8a8c8a'); for (let i = 0; i < 12; i++) { const k = i / 12; line(g, lerp(0, 370, k), lerp(560, 120, k), lerp(0, 370, k), lerp(750, 160, k), 4, '#3a3c3c'); }
    poly(g, [[1000, 750], [640, 120], [660, 0], [1000, 0]], '#4a4c4c');
    const doors = [[0.18, '201'], [0.45, '202'], [0.8, '203']];
    for (const [k, n] of doors) { const x = lerp(650, 960, k), y = lerp(150, 560, k), dh = lerp(150, 520, k), dw = lerp(36, 120, k); poly(g, [[x, y - dh], [x + dw, y - dh * 1.1], [x + dw, y + dh * 0.1], [x, y]], '#3a3c3e'); text(g, n, x + dw / 2, y - dh - 18, { size: lerp(14, 30, k), color: '#ccc', weight: 700 }); }
    if (box) { g.save(); g.translate(880, 640); g.scale(0.32, 0.32); cardboard(g, 0, 0, 1, { label: false }); g.restore(); }
    if (draw) draw(g, 1000, 750);
  });
  // 白黒・走査線・ノイズ
  g.globalCompositeOperation = 'saturation'; g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over';
  g.save(); g.globalAlpha = 0.18; for (let y = 0; y < h; y += 4) { g.fillStyle = '#000'; g.fillRect(0, y, w, 2); } g.restore();
  const R = rng(Math.floor(t * 12) + 1); g.save(); g.globalAlpha = 0.12; for (let i = 0; i < 500; i++) { g.fillStyle = R() < 0.5 ? '#fff' : '#000'; g.fillRect(R() * w, R() * h, 2, 2); } g.restore();
  const sz = Math.max(16, w * 0.035);
  text(g, cam, sz * 0.8, sz * 1.2, { size: sz, color: '#fff', align: 'left', weight: 700, stroke: '#000', sw: 4 });
  text(g, clock, w - sz * 0.8, sz * 1.2, { size: sz, color: '#fff', align: 'right', weight: 700, stroke: '#000', sw: 4 });
  if (Math.sin(t * 5) > 0) circ(g, sz * 0.9, h - sz * 1.2, sz * 0.35, '#e33'); text(g, 'REC', sz * 1.6, h - sz * 1.2, { size: sz * 0.9, color: '#fff', align: 'left', weight: 800 });
  g.restore();
}

// ---------- 管理会社の鍵の金庫（赤い札の合鍵）。missing＝203の空きを光らせる ----------
export function keyCabinet(g, { t = 0, missing = 0, open = 1, hand = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#3a3a40'], [1, '#1e1e24']]);
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(0,0,0,.15)', 10, 2.2);
  fillRR(g, 90, 220, 900, 1000, 18, '#5a5e66'); fillRR(g, 120, 250, 840, 940, 10, '#2a2c32');
  text(g, 'コーポ白樺　合鍵', 540, 300, { size: 40, color: '#e9e6df', weight: 800 });
  const rooms = ['101', '102', '103', '201', '202', '203', '301', '302', '303'];
  rooms.forEach((n, i) => {
    const cx = 260 + (i % 3) * 280, cy = 430 + Math.floor(i / 3) * 270;
    text(g, n, cx, cy - 60, { size: 34, color: n === '203' && missing ? '#ffd451' : '#c9ccd6', weight: 800 });
    for (let k = 0; k < 2; k++) {
      const kx = cx - 50 + k * 100; circ(g, kx, cy - 20, 10, '#9a9ea6');
      const has = !(n === '203' && k === 1);
      if (has) { line(g, kx, cy - 20, kx, cy + 30, 5, '#c9ced4'); fillRR(g, kx - 12, cy + 26, 24, 70, 6, '#c9ced4'); fillRR(g, kx - 20, cy + 80, 40, 60, 6, O.red); text(g, n, kx, cy + 110, { size: 16, color: '#fff', weight: 800 }); }
      else if (missing) { g.save(); g.globalAlpha = missing; g.lineWidth = 6; g.strokeStyle = '#ffd451'; g.setLineDash([12, 10]); rr(g, kx - 34, cy - 40, 68, 200, 12); g.stroke(); g.restore(); }
    }
  });
  if (open < 1) { const k = ease(open); fillRR(g, 90 + 900 * k, 220, 900 * (1 - k), 1000, 18, '#6a6e76'); }
  if (hand) { g.save(); g.translate(lerp(1200, 820, ease(hand)), 900); g.rotate(-0.3); fillRR(g, 0, -40, 500, 90, 40, OP.togawa.top2); ell(g, -10, 0, 60, 46, C.skin); g.restore(); }
}

// ---------- 1階の郵便受け（3×3）。box＝202 の口から箱がはみ出す ----------
export function mailboxes(g, { t = 0, box = 1, hi = 0 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#c8ccd0'], [1, '#9a9ea4']]);
  toneRect(g, -300, -300, W + 600, H + 600, 'rgba(0,0,0,.08)', 10, 2.2);
  fillRR(g, 80, 260, 920, 960, 12, '#8a9098');
  const rooms = ['101', '102', '103', '201', '202', '203', '301', '302', '303'];
  rooms.forEach((n, i) => {
    const x = 110 + (i % 3) * 300, y = 290 + Math.floor(i / 3) * 310;
    fillRR(g, x, y, 260, 280, 8, '#b8bcc2'); fillRR(g, x + 30, y + 40, 200, 26, 6, '#3a3e46');
    fillRR(g, x + 70, y + 120, 120, 44, 4, '#efece4'); text(g, n, x + 130, y + 143, { size: 30, color: '#3a3e46', weight: 800 });
    circ(g, x + 130, y + 220, 14, '#6a6e76');
    if (n === '202' && box) {
      g.save(); g.translate(x + 130, y + 30); g.rotate(-0.06);
      fillRR(g, -120, -90, 240, 130, 4, O.box2); fillRR(g, -120, -90, 240, 30, 4, O.box);
      fillRR(g, -90, -60, 180, 80, 3, O.paper); fillRR(g, -90, -60, 180, 16, 3, O.red);
      hand(g, '相沢ミオ様', -78, -18, { size: 28, seed: 6 });
      g.restore();
      if (hi) { g.save(); g.globalAlpha = hi; g.lineWidth = 8; g.strokeStyle = O.red2; g.beginPath(); g.ellipse(x + 130, y + 20, 170, 110, 0, 0, 7); g.stroke(); g.restore(); }
    }
  });
}

// ---------- ドアスコープの魚眼（廊下の人）。draw(q,w,h) ----------
export function scope(g, { t = 0, draw = null, night = 1 } = {}) {
  g.fillStyle = '#020204'; g.fillRect(-300, -300, W + 600, H + 600);
  const cx = 540, cy = 700, r = 440;
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.clip();
  vgrad(g, cx - r, cy - r, r * 2, r * 2, [[0, mix('#d8d8d2', '#3a3a3a', night)], [1, mix('#a8a8a2', '#1a1a1c', night)]]);
  glow(g, cx, cy - r * 0.8, r * 1.2, 'rgba(255,230,180,1)', 0.4);
  if (draw) { g.save(); g.translate(cx, cy); g.scale(1.1, 1.1); g.translate(-cx, -cy); draw(g, cx, cy, r); g.restore(); }
  const gr = g.createRadialGradient(cx, cy, r * 0.5, cx, cy, r); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.9)'); g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2);
  g.restore();
  g.lineWidth = 16; g.strokeStyle = '#0a0a0e'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
}

// ---------- 玄関を内側から：ドアが外から開き、チェーンで止まる。gap 0..1（すき間の幅）、chain＝チェーン、cut＝チェーンが切れる ----------
export function chainDoor(g, { t = 0, gap = 0, chain = 1, cut = 0, who = null, lock = 0, light = 1 } = {}) {
  vgrad(g, -300, -300, W + 600, H + 600, [[0, '#121622'], [1, '#080a10']]);
  fillRR(g, 120, 160, 840, 1400, 6, '#1c2030'); toneRect(g, 120, 160, 840, 1400, 'rgba(0,0,0,.25)', 10, 2.4);
  const gx = 300, gw = 480, gy = 300, gh = 1240, op = gap * 170; // すき間の幅（px）
  fillRR(g, gx - 16, gy - 16, gw + 32, gh + 32, 4, '#2a3040');
  // すき間の向こう（廊下の明かり）
  if (op > 1) {
    g.save(); g.beginPath(); g.rect(gx + gw - op, gy, op, gh); g.clip();
    vgrad(g, gx, gy, gw, gh, [[0, '#d8cdb4'], [1, '#8a826e']]); glow(g, gx + gw, gy + 100, 500, 'rgba(255,230,180,1)', 0.5 * light);
    if (who) who(g, gx + gw - op, gy, op, gh);
    g.restore();
  }
  // ドア本体（右の蝶番を軸に、外へ開く→左側にすき間）。簡単に：左端からすき間をあけて描く
  fillRR(g, gx, gy, gw - op, gh, 4, '#3a4658');
  toneRect(g, gx, gy, gw - op, gh, 'rgba(0,0,0,.15)', 10, 2.2);
  // サムターン
  const tx = gx + gw - op - 70; fillRR(g, tx - 30, 780, 60, 160, 12, '#8a8e96'); g.save(); g.translate(tx, 860); g.rotate(lock * Math.PI / 2); fillRR(g, -10, -44, 20, 88, 8, '#c9ced4'); g.restore();
  fillRR(g, tx - 26, 960, 52, 120, 14, '#b9bcc2'); // ノブ
  // チェーン（ドアの端と枠をつなぐ）
  if (chain) {
    const x1 = gx + gw - op - 30, x2 = gx + gw + 30, y = 640;
    if (cut < 1) { g.lineWidth = 10; g.strokeStyle = '#c9ced4'; g.setLineDash([16, 6]); g.beginPath(); g.moveTo(x1, y); g.quadraticCurveTo((x1 + x2) / 2, y + lerp(60, 4, gap), x2, y); g.stroke(); g.setLineDash([]); }
    else { g.lineWidth = 10; g.strokeStyle = '#c9ced4'; g.setLineDash([16, 6]); g.beginPath(); g.moveTo(x2, y); g.lineTo(x2 - 10, y + 160); g.stroke(); g.setLineDash([]); }
    fillRR(g, x1 - 16, y - 24, 32, 48, 6, '#9a9ea6'); fillRR(g, x2 - 10, y - 30, 40, 60, 6, '#9a9ea6');
  }
  // たたき
  vgrad(g, -300, 1556, W + 600, 600, [[0, '#24262e'], [1, '#101116']]);
  fillRR(g, 380, 1620, 130, 50, 20, '#3a3e48'); fillRR(g, 540, 1630, 130, 50, 20, '#3a3e48');
}
