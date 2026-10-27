// #拡散希望 の声（標準語）。ドラマ専用キーで Gemini 3.8 Flash TTS を使う
export const STD = 'あなたはテレビドラマの俳優です。標準語（東京式アクセント）の自然な話し方で、実際のドラマのセリフとして演じてください。方言は使わないでください。';
export const TTS_MODEL = 'gemini-3.8-flash-tts';
export const TTS_FALLBACK = []; // 声が混ざらないよう同じモデルだけで作る
export const PACE = '会話は普通のドラマの速さで。ゆっくりすぎず、急ぎすぎず、言葉ははっきりと。';
const m = TTS_MODEL;
export const VOICES = {
  A: { name: '', voice: 'Kore', style: STD + '24歳の女性。自分の身に起きたことを語る心の声。抑えた声で、不安と緊張をにじませる。' + PACE, model: m },
  AS: { name: 'アカリ', voice: 'Kore', style: STD + '24歳の女性。目の前の相手に向かって実際に話すセリフ。' + PACE, model: m },
  S: { name: 'ミサキ', voice: 'Autonoe', style: STD + '24歳の女性。親友を心配し、励ます、明るくやさしい声。' + PACE, model: m },
  O: { name: '鬼塚', voice: 'Fenrir', style: STD + '31歳の男性配信者。カメラに向かってハイテンションで、視聴者を煽るように話す。' + PACE, model: m },
  M: { name: '真壁', voice: 'Gacrux', style: STD + '45歳のベテラン刑事。落ち着いた低い声で、感情を見せずに話す。' + PACE, model: m, fx: 'phone' },
  K: { name: '健人', voice: 'Umbriel', style: STD + '26歳の男性。気が弱く、罪悪感を抱えた、迷いのある声。' + PACE, model: m },
  X: { name: '', voice: 'Schedar', style: STD + '感情のない機械の読み上げ音声のように、平坦に、一定の速さで淡々と読む。', model: m, fx: 'robot' },
};
