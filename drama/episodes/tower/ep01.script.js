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
  { id: 'h3', who: 'N', text: '地上100メートル。／そこは、誰も助けに来ない／[[r:孤島]]になる。', read: '地上ひゃくメートル。そこは、誰も助けに来ない、孤島になる。', gap: 0.2 },
  { beat: 'title', dur: 2.6 },

  // ── 日常
  { id: 'a1', who: 'N', text: '水野ミオ、29歳。／タワマンの32階で、ひとり暮らし。', read: '水野ミオ、にじゅうきゅうさい。タワマンの、さんじゅうに階で、ひとり暮らし。' },
  { id: 'a2', who: 'N', text: '家賃は給料の半分。／それでも、この夜景が好きだった。', gap: 0.5 },
  { id: 'a3', who: 'N', text: '午後7時42分。', read: '午後、しちじ、よんじゅうにふん。', gap: 0.2 },
  { beat: 'alert', dur: 1.6 },

  // ── 地震
  { id: 'q1', who: 'N', text: '揺れは、[[y:横から]]来た。', gap: 0.2 },
  { id: 'q2', who: 'N', text: '高層階は、ゆっくり、大きく、／[[y:長く揺れる。]]', gap: 0.2 },
  { id: 'q3', who: 'N', text: '床の上を、[[r:ソファが滑ってきた。]]', gap: 0.5 },
  { id: 'q4', who: 'N', text: 'そして、[[r:停電。]]', gap: 0.9 },
  { id: 'e1', who: 'N', text: 'エレベーターは最寄りの階で止まり、／[[y:技術者が点検するまで]]動かない。' },
  { id: 'e2', who: 'N', text: '2018年の大阪北部地震では、／およそ[[y:6万6千台]]が止まった。', read: 'にせんじゅうはち年の、大阪北部地震では、およそ、ろくまんろくせんだいが止まった。', gap: 0.2 },
  { id: 'e3', who: 'N', text: '技術者は、[[r:すぐには来ない。]]', gap: 0.6 },

  // ── 水
  { id: 'w1', who: 'N', text: 'ミオは真っ先に、／風呂の蛇口をひねった。' },
  { id: 'w2', who: 'N', text: '高層階の水は、／[[y:電気のポンプ]]で押し上げている。', gap: 0.15 },
  { id: 'w3', who: 'N', text: '停電すれば、[[r:水は止まる。]]', gap: 0.4 },
  { id: 'w4', who: 'N', text: '出てきたのは、／配管に残っていた[[y:最後の水]]だけ。' },
  { id: 'w5', who: 'N', text: '浴槽の底に、たった数センチ。／これがミオの[[y:命綱]]になる。', gap: 0.6 },

  // ── 隣人
  { beat: 'knock1', dur: 0.9 },
  { id: 's1', who: 'shiba', text: '水野さん！大丈夫ですか！', gap: 0.3 },
  { id: 's2', who: 'N', text: '隣の3201号室の柴田さん。／6歳の娘、ことねちゃんと二人暮らしだ。', read: '隣の、さんにーまるいち号室の、柴田さん。ろくさいの娘、ことねちゃんと、二人暮らしだ。', gap: 0.2 },
  { id: 's3', who: 'N', text: '柴田さんは、割れたグラスで／[[y:指を切っていた。]]', gap: 0.4 },
  { id: 's4', who: 'koto', text: 'パパ、おトイレ行きたい…', gap: 0.15 },
  { id: 's5', who: 'shiba', text: 'おう、行っといで。', gap: 0.1 },
  { id: 's6', who: 'mio', text: '待って！[[r:流しちゃダメ！]]', style: 'Japanese woman, 29, suddenly shouting to stop a child. Urgent and loud.', gap: 0.4 },
  { id: 'r1', who: 'N', text: '地震のあと、排水管は／どこかで[[r:割れている]]かもしれない。' },
  { id: 'r2', who: 'N', text: 'そのまま流せば、汚水は／[[r:下の階で、あふれ出す。]]', gap: 0.3 },
  { id: 'r3', who: 'N', text: 'タワマンの掟、その1。', gap: 0.2 },
  { beat: 'rule', dur: 2.2 },
  { id: 'r4', who: 'N', text: 'ミオは便器にゴミ袋をかぶせ、／新聞紙をちぎって入れた。' },
  { id: 'r5', who: 'N', text: 'これで、[[y:流さずに]]用を足せる。', gap: 0.5 },

  // ── 放送
  { beat: 'chime', dur: 1.5 },
  { id: 'p1', who: 'pa', text: 'こちら、防災センターです。', gap: 0.2 },
  { id: 'p2', who: 'pa', text: '排水管の点検が終わりました。／[[y:トイレは通常どおり、使用できます。]]', gap: 0.5 },
  { id: 'p3', who: 'shiba', text: 'よかった…。／管理会社が言うなら、大丈夫ですよね。', gap: 0.3 },
  { id: 'p4', who: 'N', text: '地震から、[[y:まだ30分。]]', read: '地震から、まだ、さんじゅっぷん。', gap: 0.2 },
  { id: 'p5', who: 'N', text: '45階建ての配管を、／30分で調べられるはずがない。', read: 'よんじゅうご階建ての配管を、さんじゅっぷんで、調べられるはずがない。', gap: 0.3 },
  { id: 'p6', who: 'N', text: 'ミオは、[[y:流さなかった。]]', gap: 0.4 },
  { id: 'p7', who: 'N', text: 'だが、この放送を信じた部屋は、／[[r:ひとつやふたつではなかった。]]', gap: 0.3 },
  { id: 'p8', who: 'N', text: 'その夜、[[r:下の階から、悲鳴が聞こえた。]]', gap: 0.1 },
  { id: 'p9', who: 'scream', text: '', read: 'きゃあああっ！', gap: 0.9 },

  // ── ノック
  { id: 'k1', who: 'N', text: '午後10時。／ドアを叩く音。', read: '午後、じゅうじ。ドアを、叩く音。', gap: 0.2 },
  { beat: 'knock2', dur: 1.0 },
  { id: 'k2', who: 'man', text: '管理会社の者です。／お部屋の点検に回っています。', gap: 0.15 },
  { id: 'k3', who: 'man', text: '開けてもらえますか。', gap: 0.5 },
  { id: 'k4', who: 'N', text: 'ドアスコープの向こうには、／帽子とマスクの、[[y:作業着の男。]]', gap: 0.3 },
  { id: 'k5', who: 'N', text: 'ミオは、[[r:チェーンを外さなかった。]]', gap: 0.4 },
  { id: 'k6', who: 'mio', text: '…明日に、してください。', style: 'Japanese woman, 29, whispering nervously through a door, holding her breath.', gap: 0.7 },
  { id: 'k7', who: 'man', text: '…わかりました。', gap: 0.5 },
  { beat: 'steps', dur: 1.8 },
  { id: 'k8', who: 'N', text: 'あとになって、ミオは気づいた。', gap: 0.4 },
  { id: 'k9', who: 'N', text: '32階まで、階段で上がってきたはずの／その男は', read: 'さんじゅうに階まで、階段で、上がってきたはずの、その男は', gap: 0.35 },
  { id: 'k10', who: 'N', text: '[[r:息ひとつ、切れていなかった。]]', style: 'Japanese drama narrator. A slow, chilling final reveal. Quiet and heavy.', gap: 1.2 },

  // ── 引き
  { beat: 'end', dur: 0.4 },
  { id: 'x1', who: 'N', text: '', read: '次回。息が切れない男。', gap: 3.2 },
];
