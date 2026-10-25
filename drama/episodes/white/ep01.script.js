// ホワイト案件 第1話「次の現場」— 台本（声・字幕・間）
// text = 字幕（[[r:語]] で赤い傍線）。text が空でも read があれば声だけ出る（カラスのチャットは吹き出しで見せるので字幕なし）。
// gap = 次の行までの間（秒）。beat = 声のない間（効果音・演出の時間）。

export const SERIES = { title: 'ホワイト案件', account: 'いつわ劇場', total: 5 };
export const EPISODE = { no: 1, title: '次の現場', next: 'おかえり', ask: '電話に出たのは誰？ コメントで予想して' };

const PACE = 'Natural, brisk pacing like a modern thriller drama. No long pauses, no dragging, not rushed either.';
export const CAST = {
  Y: { name: 'ユウマ', voice: 'Puck', style: `A 21-year-old Japanese college man from Osaka, speaking his tense inner monologue in Kansai dialect. Low, close to the mic, breathing a little. ${PACE}` },
  K: { name: 'カラス', voice: 'Schedar', style: `A cold, emotionless voice reading a text message aloud. Flat, mechanical, quiet and unsettling. Kansai dialect. ${PACE}`, fx: 'robot' },
  M: { name: '母', voice: 'Sulafat', style: `A warm Japanese mother in her late 40s from Osaka, casual Kansai dialect, slightly puzzled, reading her own chat message. ${PACE}`, fx: 'msg' },
  J: { name: 'ジン', voice: 'Algenib', style: `A rough Japanese man in his mid 20s from Osaka, low and gravelly, speaking quietly in a car at night, Kansai dialect. Hides that he is scared. ${PACE}` },
  P: { name: '警官', voice: 'Orus', style: `A Japanese police officer at a night checkpoint, polite but watchful, standard Japanese. ${PACE}`, fx: 'outside' },
  X: { name: '電話の声', voice: 'Charon', style: 'A calm, gentle Japanese man answering a phone in a dark house. Soft, slow, chilling, almost kind.', fx: 'phone' },
};

export const LINES = [
  // ── 冒頭10秒
  { beat: 'notif', dur: 0.5 },
  { id: 'o1', who: 'K', text: '', read: '次の現場。', gap: 0.25 },
  { id: 'o2', who: 'Y', text: '…ここ、[[r:俺の家]]や。', read: '…ここ、俺の家や。', gap: 0.2 },
  { id: 'o3', who: 'Y', text: 'この写真、[[r:家の中から]]撮られてる。', gap: 0.15 },
  { id: 'o4', who: 'M', text: '', read: 'ユウマ、帰ってきてるん？　にかいで物音するけど。', gap: 0.25 },
  { id: 'o5', who: 'Y', text: '俺は、[[r:帰ってへん。]]', gap: 0.25 },
  { id: 'o6', who: 'K', text: '', read: 'にじゅういちじまでに来い。金庫の番号は、お前が知ってる。', gap: 0.1 },
  { beat: 'title', dur: 1.7 },

  // ── 3日前（15秒）
  { id: 'b1', who: 'Y', text: '3日前。日給1万5千円の、引越しバイト。', read: '3日前。日給いちまんごせんえんの、引越しバイト。', gap: 0.1 },
  { id: 'b2', who: 'Y', text: '運んだ段ボールの中身は、[[r:札束]]やった。', gap: 0.15 },
  { id: 'b3', who: 'K', text: '', read: 'お前の顔、カメラに残ってるで。もう共犯や。', gap: 0.1 },
  { id: 'b4', who: 'Y', text: '免許証を撮られて、全部終わった。', gap: 0.2 },

  // ── 今
  { id: 'c1', who: 'Y', text: '母さんに、2階に行くなって送った。', read: '母さんに、にかいに行くなって送った。', gap: 0.1 },
  { id: 'c2', who: 'Y', text: '[[r:既読に、ならへん。]]', gap: 0.2 },
  { id: 'c3', who: 'Y', text: '警察や。1、1…', read: '警察や。いち、いち…', gap: 0.05 },
  { beat: 'cut110', dur: 0.35 },
  { id: 'c4', who: 'K', text: '', read: '通報したら、にかいのやつが降りる。', gap: 0.15 },
  { id: 'c5', who: 'Y', text: 'なんでわかるねん。[[r:スマホ、見られてる…？]]', gap: 0.2 },
  { id: 'd1', who: 'Y', text: 'こんな時に、電車が止まった。', gap: 0.1 },
  { beat: 'car', dur: 0.8 },
  { id: 'd2', who: 'J', text: '乗れ。カラスからや。', gap: 0.2 },
  { id: 'd3', who: 'J', text: 'スマホは切るな。全部見られてる。', gap: 0.15 },
  { id: 'd4', who: 'J', text: '最初の現場はな、だいたい[[r:身内の家]]や。逃げられへんようにな。', gap: 0.15 },
  { id: 'd5', who: 'J', text: 'ヤバなったら、俺が3回叩く。そしたら逃げろ。', read: 'ヤバなったら、俺がさんかい叩く。そしたら逃げろ。', gap: 0.15 },
  { id: 'd6', who: 'Y', text: 'こいつの手、[[r:震えてる。]]', gap: 0.2 },

  // ── 検問
  { beat: 'siren', dur: 0.7 },
  { id: 'e1', who: 'Y', text: 'やばい、[[r:検問や…！]]', gap: 0.1 },
  { id: 'e2', who: 'P', text: 'こんばんは。どちらまで？', gap: 0.1 },
  { id: 'e3', who: 'J', text: '実家に、忘れもん取りに。', gap: 0.15 },
  { id: 'e4', who: 'Y', text: '手袋、[[r:見られた。]]', gap: 0.5 },
  { id: 'e5', who: 'P', text: '…気をつけて。', gap: 0.3 },

  // ── 妹
  { id: 'f1', who: 'M', text: '', read: 'ミクが、にかいを見に行くって。', gap: 0.1 },
  { id: 'f2', who: 'Y', text: '[[r:やめろ、ミク…！]]', style: 'A 21-year-old Japanese man shouting desperately at his phone, Kansai dialect. Short and sharp.', gap: 0.15 },
  { id: 'f3', who: 'K', text: '', read: '来たら、何もせえへん。', gap: 0.2 },
  { id: 'f4', who: 'Y', text: '先輩に、助けてって送った。', gap: 0.1 },
  { id: 'f5', who: 'K', text: '', read: '先輩なら、ここにおるで。', gap: 0.15 },
  { id: 'f6', who: 'Y', text: 'この仕事を紹介したのは、[[r:先輩]]やった。', gap: 0.3 },

  // ── 実家
  { id: 'g1', who: 'Y', text: '20時58分。1階は、真っ暗や。', read: 'にじゅうじ、ごじゅうはっぷん。いっかいは、真っ暗や。', gap: 0.1 },
  { id: 'g2', who: 'Y', text: '明かりがついてるのは、2階の、[[r:俺の部屋]]だけ。', read: '明かりがついてるのは、にかいの、俺の部屋だけ。', gap: 0.2 },
  { beat: 'door', dur: 0.6 },
  { id: 'g3', who: 'Y', text: '鍵が、[[r:開いてる。]]', gap: 0.25 },
  { id: 'g4', who: 'Y', text: 'この靴…[[r:誰のや。]]', read: 'この靴…だれのや。', gap: 0.3 },
  { id: 'g5', who: 'Y', text: '母さんに、電話をかけた。', gap: 0.1 },
  { beat: 'ring', dur: 1.6 },
  { id: 'g6', who: 'Y', text: '[[r:2階で、鳴ってる。]]', read: 'にかいで、鳴ってる。', style: 'A 21-year-old Japanese man whispering in terror in a dark house, Kansai dialect.', gap: 0.25 },
  { beat: 'pickup', dur: 0.9 },
  { id: 'g7', who: 'X', text: '…おかえり、[[r:ユウマくん。]]', gap: 1.0 },

  // ── 引き
  { beat: 'end', dur: 0.3 },
  { id: 'x1', who: 'K', text: '', read: '次回。おかえり。', gap: 2.6 },
];
