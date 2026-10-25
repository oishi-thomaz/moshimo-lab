// ホワイト案件 第1話「次の現場」— 台本（組み直し版）
// text = 字幕（[[r:語]] で赤い傍線）。text が空でも read があれば声だけ出る（カラスのチャットは吹き出しで見せるので字幕なし）。
// gap = 次の行までの間（秒）。beat = 声のない間（場面転換・効果音の時間）。

export const SERIES = { title: 'ホワイト案件', account: 'いつわ劇場', total: 5 };
export const EPISODE = { no: 1, title: '次の現場', next: 'おかえり', ask: '電話に出たのは誰？ コメントで予想して' };

const OSAKA = 'You are a native speaker born and raised in Osaka. Speak with a natural, authentic Osaka (Kansai) pitch accent and intonation, exactly like a local Osaka person. Never use standard Tokyo intonation. ';
const PACE = ' Natural conversational pace, like a real drama. Not slow, not rushed.';
export const CAST = {
  Y: { name: '', voice: 'Achird', style: OSAKA + 'A 21-year-old college man telling his own story in a quiet, tense inner monologue.' + PACE },
  K: { name: '', voice: 'Alnilam', style: OSAKA + 'A cold, quiet man in his 40s threatening someone. Calm, low and unsettling. Not robotic, not exaggerated.' + PACE, fx: 'msg' },
  J: { name: 'ジン', voice: 'Algenib', style: OSAKA + 'A rough man in his mid 20s, low and gravelly, few words, speaking quietly.' + PACE },
  X: { name: '？？？', voice: 'Charon', style: OSAKA + 'A calm, gentle man answering a phone in a dark house. Soft, slow, chilling, almost kind.', fx: 'phone' },
};

export const LINES = [
  // ── 1. 今夜、実家の前（冒頭）
  { beat: 'open', dur: 1.2 },
  { id: 'a1', who: 'K', text: '', read: '着いたな。中に入れ。', gap: 0.5 },
  { id: 'a2', who: 'Y', text: '目の前にあるんは、俺が生まれ育った家や。', read: '目の前にあるんは、俺が生まれ育った家や。', gap: 0.35 },
  { id: 'a3', who: 'Y', text: '俺は今から、この家に[[r:盗みに入る。]]', gap: 0.5 },
  { id: 'a4', who: 'Y', text: 'なんでこうなったんか。話は3日前にさかのぼる。', read: 'なんでこうなったんか。話は、みっか前にさかのぼる。', gap: 0.3 },
  { beat: 'title', dur: 2.2 },

  // ── 2. ユウマの部屋（3日前）
  { id: 'b1', who: 'Y', text: '篠原ユウマ、21歳。大学3年。', read: 'しのはらユウマ、にじゅういっさい。大学さんねん。', gap: 0.35 },
  { id: 'b2', who: 'Y', text: 'オカンは介護の夜勤をしながら、中3の妹を育ててる。', read: 'オカンは介護の夜勤をしながら、ちゅうさんの妹を育ててる。', gap: 0.35 },
  { id: 'b3', who: 'Y', text: '仕送りなんか頼まれへんし、[[r:家賃はもう2か月]]払えてへん。', read: '仕送りなんか頼まれへんし、家賃はもう、ふたつき払えてへん。', gap: 0.5 },
  { id: 'b4', who: 'Y', text: 'そんな時に見つけたんが、このバイトや。', gap: 0.3 },
  { id: 'b5', who: 'Y', text: '引越しの手伝いで、日払い1万5千円。', read: '引越しの手伝いで、日払い、いちまんごせんえん。', gap: 0.3 },
  { id: 'b6', who: 'Y', text: '普通のバイトやと、思ってた。', gap: 0.6 },

  // ── 3. 引越しの現場
  { beat: 'van', dur: 1.0 },
  { id: 'c1', who: 'J', text: '篠原くんか。ジンや。今日は荷物運ぶだけやから。', gap: 0.4 },
  { id: 'c2', who: 'Y', text: '段ボールを積んで、別の家に運ぶだけ。', gap: 0.4 },
  { id: 'c3', who: 'J', text: 'おつかれ。ほい、今日の分。', gap: 0.35 },
  { beat: 'drop', dur: 1.0 },
  { id: 'c5', who: 'Y', text: '最後の箱が落ちて、中から出てきたんは…[[r:札束]]やった。', read: '最後の箱が落ちて、中から出てきたんは…さつたばやった。', gap: 0.45 },
  { id: 'c6', who: 'J', text: '…見てもうたな。', gap: 0.8 },

  // ── 4. 帰り道
  { beat: 'ping1', dur: 0.7 },
  { id: 'd1', who: 'Y', text: '帰り道、知らん相手から[[r:メッセージ]]が来た。', gap: 0.3 },
  { id: 'd2', who: 'K', text: '', read: 'お前が今日運んだんはな、年寄りから騙し取った金や。', gap: 0.35 },
  { id: 'd3', who: 'K', text: '', read: 'もう共犯やで。逃げられへんで。', gap: 0.35 },
  { id: 'd4', who: 'K', text: '', read: '免許証の写真、送ってこい。送らんかったら、警察行きやで。', gap: 0.4 },
  { id: 'd5', who: 'Y', text: '怖くて、言われたとおりに送ってしもた。', gap: 0.3 },
  { id: 'd6', who: 'Y', text: 'それが、[[r:一番の間違い]]やったんや。', gap: 0.7 },

  // ── 5. 3日後の朝
  { id: 'e1', who: 'Y', text: '次の日、俺はこいつを[[r:ブロック]]した。', gap: 0.5 },
  { beat: 'days', dur: 1.2 },
  { id: 'e2', who: 'Y', text: '3日後の朝。知らん番号から、写真が届いた。', read: 'みっか後の朝。知らん番号から、写真が届いた。', gap: 0.4 },
  { id: 'e3', who: 'Y', text: 'オカンの[[r:職場]]や。', gap: 0.4 },
  { id: 'e4', who: 'K', text: '', read: 'ミクちゃん、中3やな。かわいい妹やんけ。', gap: 0.35 },
  { id: 'e5', who: 'K', text: '', read: 'ブロックして、逃げれると思たんか。', gap: 0.35 },
  { id: 'e6', who: 'K', text: '', read: '次の仕事や。今夜、この家の金庫の中身を持ってこい。', gap: 0.35 },
  { id: 'e7', who: 'K', text: '', read: '番号は、お前が知っとるやろ。', gap: 0.5 },
  { id: 'e8', who: 'Y', text: '送られてきた住所は、[[r:俺の実家]]やった。', gap: 0.35 },
  { id: 'e9', who: 'Y', text: '金庫には、死んだオトンの[[r:保険金]]が入ってる。', gap: 0.7 },

  // ── 6. ジンの車
  { beat: 'car', dur: 1.0 },
  { id: 'f1', who: 'Y', text: 'その夜、迎えに来たんは、ジンやった。', gap: 0.35 },
  { id: 'f2', who: 'J', text: '最初の現場はな、だいたい[[r:身内の家]]や。', gap: 0.3 },
  { id: 'f3', who: 'J', text: '家族は、警察に言われへんからな。', gap: 0.45 },
  { id: 'f4', who: 'J', text: 'ヤバなったら、俺が3回叩く。そしたら、何も考えんと逃げろ。', read: 'ヤバなったら、俺がさんかい叩く。そしたら、何も考えんと逃げろ。', gap: 0.4 },
  { id: 'f5', who: 'Y', text: 'なんで、そんなこと教えてくれるんや。', gap: 0.3 },
  { beat: 'silent', dur: 1.3 },

  // ── 7. 実家の前に戻る
  { id: 'g1', who: 'Y', text: 'そして、今や。', gap: 0.35 },
  { id: 'g2', who: 'Y', text: '盗みなんかせえへん。オカンに[[r:全部話す。]]', gap: 0.4 },
  { id: 'g3', who: 'Y', text: 'オカンに、電話をかけた。', gap: 0.2 },
  { beat: 'ring', dur: 1.8 },
  { id: 'g4', who: 'Y', text: '家の中で、オカンのスマホが鳴ってる。', gap: 0.3 },
  { id: 'g5', who: 'Y', text: '[[r:2階からや。]]', read: 'にかいからや。', gap: 0.4 },
  { beat: 'pickup', dur: 1.0 },
  { id: 'g6', who: 'X', text: '…おかえり、[[r:ユウマくん。]]', read: '…おかえり、ゆうまくん。', gap: 0.8 },
  { id: 'g7', who: 'Y', text: '電話に出たんは、[[r:オカンやなかった。]]', gap: 1.0 },

  // ── 引き
  { beat: 'end', dur: 0.3 },
  { id: 'x1', who: 'K', text: '', read: '次回。おかえり。', gap: 2.8 },
];
