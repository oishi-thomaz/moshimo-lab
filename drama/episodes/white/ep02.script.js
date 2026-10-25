// ホワイト案件 第2話「おかえり」— 台本
// 声の大阪弁の指示は OSAKA_STYLE で一括管理（聞き比べで選んだ書き方を使う）

export const SERIES = { title: 'ホワイト案件', account: 'いつわ劇場', total: 5 };
export const EPISODE = { no: 2, title: 'おかえり', next: 'カラスの巣', ask: 'ユウマはどうする？ コメントで予想して' };

export const OSAKA_STYLE = 'あなたは大阪で生まれ育った大阪の人です。京阪式アクセントの、普段どおりの自然な大阪弁で話してください。標準語（東京式）のアクセントやイントネーションは絶対に使わないでください。「ほんま」「あかん」「やろ」「へん」「ねん」などは、大阪の人が日常で話す抑揚そのままで。お笑い芸人のような大げさな関西弁にはしないでください。';
export const TTS_MODEL = 'gemini-2.5-pro-preview-tts'; // 大阪弁の聞き比べ 候補1（日本語の指示 × 2.5 Pro）
export const TTS_FALLBACK = ['gemini-2.5-flash-preview-tts']; // Pro が上限なら Flash に。もしもラボの 3.8 は使わない
const PACE = '会話は普通のドラマの速さで。ゆっくりすぎず、急ぎすぎず。';
export const CAST = {
  Y: { name: '', voice: 'Achird', style: OSAKA_STYLE + '21歳の大学生の男性。自分の身に起きたことを、小さな声で緊張しながら語る心の声。' + PACE, model: TTS_MODEL },
  S: { name: '坂口', voice: 'Charon', style: OSAKA_STYLE + '50代の穏やかで優しい男性。やわらかく温かい声で話す。' + PACE, model: TTS_MODEL },
  J: { name: 'ジン', voice: 'Algenib', style: OSAKA_STYLE + '20代半ばの無口な男。低くざらついた声で、言葉少なに静かに話す。' + PACE, model: TTS_MODEL },
  K: { name: '', voice: 'Alnilam', style: OSAKA_STYLE + '40代の冷たい男。低く静かな声で話す。' + PACE, model: TTS_MODEL, fx: 'msg' },
  X: { name: '？？？', voice: 'Charon', style: OSAKA_STYLE + '暗い家の中で電話に出た、落ち着いた優しい男性。やわらかく、ゆっくり、ぞっとするほど穏やかに。', model: TTS_MODEL, fx: 'phone' },
};

export const LINES = [
  // ── 前回のあらすじ
  { beat: 'recap', dur: 0.6 },
  { id: 'r1', who: 'Y', text: '闇バイトで脅されて、実家の金庫を狙えと言われた俺は、／オカンに電話をかけた。', gap: 0.3 },
  { id: 'r2', who: 'Y', text: '出たんは、[[r:知らん男の声]]やった。', gap: 0.3 },
  { id: 'r3', who: 'X', text: '…おかえり、ユウマくん。', read: '…おかえり、ゆうまくん。', gap: 0.4 },
  { beat: 'title', dur: 2.2 },

  // ── 1. 降りてきた男
  { beat: 'door', dur: 1.0 },
  { id: 'a1', who: 'Y', text: '玄関のドアが開いて、男が階段を降りてきた。', gap: 0.35 },
  { id: 'a2', who: 'S', text: '驚かせてごめんな。坂口いいます。／お母さんと、お付き合いさせてもろてる。', gap: 0.4 },
  { id: 'a3', who: 'Y', text: 'オカンが前に言うてた[[r:会わせたい人]]って…この人か。', gap: 0.35 },
  { id: 'a4', who: 'S', text: 'お母さん、夜勤にスマホ忘れていきはってな。／届けに行こ思て、取りに来たとこやねん。', gap: 0.4 },
  { id: 'a5', who: 'Y', text: '優しそうな人やった。体の力が、一気に抜けた。', gap: 0.6 },

  // ── 2. 全部話す
  { id: 'b1', who: 'Y', text: '気づいたら、[[r:全部話してた。]]', gap: 0.35 },
  { id: 'b2', who: 'Y', text: 'バイトのこと。カラスのこと。／今夜、この家の金庫を狙えって言われたこと。', gap: 0.5 },
  { id: 'b3', who: 'S', text: '…よう話してくれたな。一人で、しんどかったやろ。', gap: 0.4 },
  { id: 'b4', who: 'S', text: '明日の朝、一緒に[[r:警察]]行こ。俺もついてったる。', gap: 0.35 },
  { id: 'b5', who: 'S', text: 'お母さんには、俺から話しとくから。', gap: 0.4 },
  { id: 'b6', who: 'Y', text: '誰かに、そう言うてほしかった。', gap: 0.7 },

  // ── 3. 外のジン
  { id: 'c1', who: 'Y', text: '外では、ジンが車で待ってた。', gap: 0.35 },
  { id: 'c2', who: 'Y', text: '俺は降りる。もう、やらへん。', style: OSAKA_STYLE + '21歳の大学生の男性が、車の窓越しに、震える声で、でもはっきりと言う。', gap: 0.5 },
  { id: 'c3', who: 'J', text: '…そうか。', gap: 0.4 },
  { id: 'c4', who: 'J', text: 'ほな、これ持っとけ。何かあったら、ここに電話せえ。', gap: 0.4 },
  { id: 'c5', who: 'J', text: 'カラスはな、お前が思てるより、[[r:近くにおる]]で。', gap: 0.5 },
  { id: 'c6', who: 'Y', text: '車は、そのまま走っていった。', gap: 0.6 },

  // ── 4. 金庫
  { id: 'd1', who: 'S', text: '金庫、無事か見とこか。', gap: 0.35 },
  { id: 'd2', who: 'Y', text: '坂口さんは、[[r:迷わず]]仏壇の下の扉を開けた。', gap: 0.4 },
  { id: 'd3', who: 'S', text: '番号、ユウマくん知ってるんか？', gap: 0.4 },
  { id: 'd4', who: 'Y', text: '…オトンの[[r:誕生日]]や。', style: OSAKA_STYLE + '21歳の大学生の男性が、相手を信じきって、ぽろっと答える。', gap: 0.5 },
  { id: 'd5', who: 'S', text: 'そうか。ほな、明日まで触らんとこな。', gap: 0.35 },
  { id: 'd6', who: 'S', text: 'ミクちゃんは、もう[[r:2階で寝てる]]で。', read: 'ミクちゃんは、もう、にかいで寝てるで。', gap: 0.7 },

  // ── 5. カラスに送る
  { id: 'e1', who: 'Y', text: 'これで終わりや。俺は、カラスにメッセージを送った。', gap: 0.35 },
  { id: 'e2', who: 'Y', text: '全部、警察に話す。もう、お前の言うことは聞かへん。', style: OSAKA_STYLE + '21歳の大学生の男性が、スマホに打ち込みながら、決意を込めて静かに読み上げる。', gap: 0.3 },
  { beat: 'send', dur: 1.6 },

  // ── 6. 震えるスマホ
  { id: 'f1', who: 'Y', text: 'その時、テーブルの上で、[[r:スマホが震えた。]]', gap: 0.4 },
  { id: 'f2', who: 'Y', text: '坂口さんの、スマホやった。', gap: 0.4 },
  { id: 'f3', who: 'Y', text: '画面に出てたんは…[[r:俺が今送ったメッセージ]]やった。', gap: 0.5 },
  { beat: 'reveal', dur: 1.2 },
  { id: 'f4', who: 'S', text: '…ほんまに、[[r:ええ子やなあ。]]ユウマくん。', read: '…ほんまに、ええ子やなあ。ゆうまくん。', style: OSAKA_STYLE + '50代の男性。さっきまでと同じ優しい声のまま、ぞっとするほど静かに、ゆっくり微笑むように言う。', gap: 1.2 },

  // ── 引き
  { beat: 'end', dur: 0.3 },
  { id: 'x1', who: 'K', text: '', read: '次回。カラスの巣。', gap: 2.8 },
];
