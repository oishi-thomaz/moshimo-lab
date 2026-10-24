// タワマン孤島 第1話「流すな」— 台本（声・字幕・間）
// 1行 = 1つの声。text は字幕にそのまま出す（[[r:語]] 赤、[[y:語]] 黄で強調、／で字幕の区切り）。
// read は読み方の上書き（字幕と違う読みをさせたいとき）。gap は次の行までの間（秒）。
// beat は声のない間（タイトル・掟カード・効果音だけの時間）。

export const SERIES = {
  title: 'タワマン孤島',
  account: 'いつわ劇場',
  total: 5,
};

export const EPISODE = {
  no: 1,
  title: '流すな',
  next: '息が切れない男',
  ask: 'この男は誰？ コメントで予想して',
};

// 声の割り当て（Gemini TTS）
export const CAST = {
  N: { name: 'ナレーター', voice: 'Charon', style: 'Japanese drama narrator for a suspense survival story. Low, calm, serious, slightly tense. Clear diction, measured pace, short dramatic pauses at commas.' },
  mio: { name: 'ミオ', voice: 'Kore', style: 'Japanese woman, 29, inside a dark apartment after an earthquake. Natural, tense, real drama acting.' },
  shiba: { name: '柴田', voice: 'Achird', style: 'Japanese man, early 40s, kind father, worried but trying to sound calm. Natural drama acting.' },
  koto: { name: 'ことね', voice: 'Leda', style: 'A shy 6-year-old Japanese girl, small and sleepy voice, speaking softly to her dad.', fx: 'child' },
  pa: { name: '館内放送', voice: 'Schedar', style: 'Japanese building management announcement over a PA system. Polite, flat, official, slow and clear.', fx: 'pa' },
  man: { name: '作業着の男', voice: 'Algenib', style: 'Japanese man speaking through a closed apartment door. Polite but cold and flat, unnaturally calm, quiet.', fx: 'door' },
  scream: { name: '悲鳴', voice: 'Zephyr', style: 'A woman screaming in shock and disgust, short scream.', fx: 'far' },
};

export const LINES = [
  // ── フック
  { id: 'h1', who: 'N', text: 'もし大地震が起きた時、／あなたが[[y:タワマンの32階]]にいたら', read: 'もし大地震が起きた時、あなたがタワマンの、さんじゅうに階にいたら', gap: 0.15 },
  { id: 'h2', who: 'N', text: '絶対に、[[r:トイレを流すな。]]', gap: 0.5, style: 'Japanese drama narrator. A sudden, firm, low warning. Slow and heavy.' },
  { id: 'h3', who: 'N', text: '地上100メートル。／そこは、[[r:孤島]]になる。', read: '地上ひゃくメートル。そこは、孤島になる。', gap: 0.15 },
  { beat: 'title', dur: 2.2 },

  // ── 日常
  { id: 'a1', who: 'N', text: '水野ミオ、29歳。／32階で、ひとり暮らし。', read: '水野ミオ、にじゅうきゅうさい。さんじゅうに階で、ひとり暮らし。', gap: 0.15 },
  { id: 'a2', who: 'N', text: 'この夜景が、自慢だった。', gap: 0.35 },
  { id: 'a3', who: 'N', text: '午後7時42分。', read: '午後、しちじ、よんじゅうにふん。', gap: 0.2 },
  { beat: 'alert', dur: 1.3 },

  // ── 地震
  { id: 'q1', who: 'N', text: '揺れは、[[y:横から]]来た。', gap: 0.2 },
  { id: 'q2', who: 'N', text: '高層階は、大きく、／[[y:長く揺れる。]]', gap: 0.15 },
  { id: 'q3', who: 'N', text: '床の上を、[[r:ソファが滑ってきた。]]', gap: 0.5 },
  { id: 'q4', who: 'N', text: 'そして、[[r:停電。]]', gap: 0.9 },
  { id: 'e1', who: 'N', text: 'エレベーターは、／[[y:点検が済むまで]]動かない。', gap: 0.15 },
  { id: 'e2', who: 'N', text: '大阪北部地震では、／[[y:6万6千台]]が止まった。', read: '大阪北部地震では、ろくまんろくせんだいが止まった。', gap: 0.9 },

  // ── 水
  { id: 'w1', who: 'N', text: 'ミオは真っ先に、／風呂の蛇口をひねった。' },
  { id: 'w2', who: 'N', text: '高層階の水は、／[[y:電気のポンプ]]で押し上げている。', gap: 0.15 },
  { id: 'w3', who: 'N', text: '停電すれば、[[r:水は止まる。]]', gap: 0.4 },
  { id: 'w4', who: 'N', text: '出たのは、／配管に残った[[y:最後の水]]だけ。', gap: 0.15 },
  { id: 'w5', who: 'N', text: '浴槽に、数センチ。／これが[[y:命綱]]だ。', gap: 0.4 },

  // ── 隣人
  { beat: 'knock1', dur: 0.9 },
  { id: 's1', who: 'shiba', text: '水野さん！大丈夫ですか！', gap: 0.3 },
  { id: 's2', who: 'N', text: '隣の柴田さん。／6歳の娘と、二人暮らしだ。', read: '隣の柴田さん。ろくさいの娘と、二人暮らしだ。', gap: 0.15 },
  { id: 's3', who: 'N', text: '柴田さんは、割れたグラスで／[[y:指を切っていた。]]', gap: 0.3 },
  { id: 's4', who: 'koto', text: 'パパ、おトイレ行きたい…', gap: 0.15 },
  { id: 's5', who: 'shiba', text: 'おう、行っといで。', gap: 0.1 },
  { id: 's6', who: 'mio', text: '待って！[[r:流しちゃダメ！]]', style: 'Japanese woman, 29, suddenly shouting to stop a child. Urgent and loud.', gap: 0.4 },
  { id: 'r1', who: 'N', text: '地震のあと、排水管は／[[r:割れている]]かもしれない。', gap: 0.15 },
  { id: 'r2', who: 'N', text: '流せば、汚水は／[[r:下の階であふれ出す。]]', gap: 0.25 },
  { id: 'r3', who: 'N', text: 'タワマンの掟、その1。', gap: 0.2 },
  { beat: 'rule', dur: 1.9 },
  { id: 'r4', who: 'N', text: '便器にゴミ袋をかぶせ、／新聞紙を入れる。', read: 'べんきに、ゴミ袋をかぶせ、新聞紙を入れる。', gap: 0.15 },
  { id: 'r5', who: 'N', text: '[[y:流さずに]]使えるトイレだ。', gap: 0.4 },

  // ── 放送
  { beat: 'chime', dur: 1.3 },
  { id: 'p2', who: 'pa', text: '防災センターです。点検が終わりました。／[[y:トイレは、使えます。]]', gap: 0.35 },
  { id: 'p3', who: 'shiba', text: 'よかった…。／管理会社が言うなら、大丈夫ですよね。', gap: 0.25 },
  { id: 'p5', who: 'N', text: '45階分の配管を、／[[y:30分]]で調べられるはずがない。', read: 'よんじゅうご階分の配管を、さんじゅっぷんで調べられるはずがない。', gap: 0.25 },
  { id: 'p6', who: 'N', text: 'ミオは、[[y:流さなかった。]]', gap: 0.3 },
  { id: 'p7', who: 'N', text: 'だが、放送を信じた部屋は、／[[r:ひとつやふたつではなかった。]]', gap: 0.2 },
  { id: 'p8', who: 'N', text: 'その夜、[[r:下の階から、悲鳴が聞こえた。]]', gap: 0.1 },
  { id: 'p9', who: 'scream', text: '', read: 'きゃあああっ！', gap: 0.7 },

  // ── ノック
  { id: 'k1', who: 'N', text: '午後10時。', read: '午後、じゅうじ。', gap: 0.1 },
  { beat: 'knock2', dur: 1.0 },
  { id: 'k2', who: 'man', text: '管理会社の者です。／お部屋の点検に回っています。', gap: 0.15 },
  { id: 'k3', who: 'man', text: '開けてもらえますか。', gap: 0.5 },
  { id: 'k4', who: 'N', text: 'ドアスコープの向こうに、／[[y:作業着の男。]]', gap: 0.25 },
  { id: 'k5', who: 'N', text: 'ミオは、[[r:チェーンを外さなかった。]]', gap: 0.3 },
  { id: 'k6', who: 'mio', text: '…明日に、してください。', style: 'Japanese woman, 29, whispering nervously through a door, holding her breath.', gap: 0.7 },
  { id: 'k7', who: 'man', text: '…わかりました。', gap: 0.5 },
  { beat: 'steps', dur: 1.4 },
  { id: 'k8', who: 'N', text: 'あとになって、ミオは気づいた。', gap: 0.4 },
  { id: 'k9', who: 'N', text: '32階まで、階段で／上がってきたはずの男は', read: 'さんじゅうに階まで、階段で上がってきたはずの、その男は', gap: 0.3 },
  { id: 'k10', who: 'N', text: '[[r:息ひとつ、切れていなかった。]]', style: 'Japanese drama narrator. A slow, chilling final reveal. Quiet and heavy.', gap: 1.2 },

  // ── 引き
  { beat: 'end', dur: 0.4 },
  { id: 'x1', who: 'N', text: '', read: '次回。息が切れない男。', gap: 2.6 },
];
