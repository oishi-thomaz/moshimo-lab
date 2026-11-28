// 位置情報 の声（標準語）。ドラマ専用キーで Gemini 3.8 Flash TTS を使う
// アヤ（心の声と口に出すセリフ）＝同じ声。子ども（ソウタ・ハルト）は child で少し高くする
export const STD = 'あなたはテレビドラマの俳優です。標準語（東京式アクセント）の自然な話し方で、実際のドラマのセリフとして演じてください。方言は使わないでください。';
export const TTS_MODEL = 'gemini-3.8-flash-tts';
export const TTS_FALLBACK = []; // 声が混ざらないよう同じモデルだけで作る
export const PACE = '会話は普通のドラマの速さで。ゆっくりすぎず、急ぎすぎず、言葉ははっきりと。';
const m = TTS_MODEL;
export const VOICES = {
  N: { name: '', voice: 'Sulafat', style: STD + '37歳の女性。小学3年の息子の母親。自分の身に起きたことを語る心の声。落ち着いた低めの声に、不安と緊張をにじませる。' + PACE, model: m },
  AY: { name: 'アヤ', voice: 'Sulafat', style: STD + '37歳の女性。小学3年の息子に話しかける母親。やさしく、でも気になっていることを隠しながら。' + PACE, model: m },
  SO: { name: 'ソウタ', voice: 'Leda', style: STD + '9歳の男の子。小学3年生。素直で、少し幼い話し方。' + PACE, model: m, fx: 'child' },
  HT: { name: 'ハルト', voice: 'Puck', style: STD + '9歳の男の子。小さく、か細く、おびえた声で、ささやくように。' + PACE, model: m, fx: 'child' },
  KJ: { name: 'ケンジ', voice: 'Iapetus', style: STD + '41歳の男性。アヤの夫。電話越しに、穏やかに話す。' + PACE, model: m, fx: 'phone' },
  MN: { name: '戸田', voice: 'Rasalgethi', style: STD + '42歳の男性。低く、丁寧で、感じがいいのに、どこか冷たい話し方。' + PACE, model: m, fx: 'door' },
  MS: { name: 'ミサキ', voice: 'Aoede', style: STD + '36歳の女性。電話越しに、小さな声で、必死に話す。' + PACE, model: m, fx: 'phone' },
  X: { name: '', voice: 'Schedar', style: STD + '感情のない機械の読み上げ音声のように、平坦に、一定の速さで淡々と読む。', model: m, fx: 'robot' },
};
