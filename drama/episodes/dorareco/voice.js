// ドラレコ の声（標準語）。ドラマ専用キーで Gemini 3.8 Flash TTS を使う
// ショウジ（心の声と口に出すセリフ）＝同じ声。灰原はメッセージを読む声（第1話）と電話の声を同じ声で
export const STD = 'あなたはテレビドラマの俳優です。標準語（東京式アクセント）の自然な話し方で、実際のドラマのセリフとして演じてください。方言は使わないでください。';
export const TTS_MODEL = 'gemini-3.8-flash-tts';
export const TTS_FALLBACK = []; // 声が混ざらないよう同じモデルだけで作る
export const PACE = '会話は普通のドラマの速さで。ゆっくりすぎず、急ぎすぎず、言葉ははっきりと。';
const m = TTS_MODEL;
export const VOICES = {
  N: { name: '', voice: 'Alnilam', style: STD + '48歳の男性。深夜のタクシーの運転席で、自分の身に起きたことを語る心の声。低く、落ち着いた声に、緊張と後ろめたさをにじませる。' + PACE, model: m },
  NS: { name: 'ショウジ', voice: 'Alnilam', style: STD + '48歳の男性。タクシー運転手。後ろの席の客に実際に話すセリフ。低く、ぶっきらぼうに。' + PACE, model: m },
  YU: { name: 'ユキ', voice: 'Callirrhoe', style: STD + '31歳の女性。タクシーの後ろの席から、運転手に静かに話す。落ち着いているが、何かを決めている声。' + PACE, model: m },
  HR: { name: 'ハルナ', voice: 'Kore', style: STD + '26歳の女性。やわらかく、少しおびえた声。' + PACE, model: m },
  MY: { name: 'マユ', voice: 'Leda', style: STD + '19歳の女性。大学生。父親に電話で話す、明るい声。' + PACE, model: m, fx: 'phone' },
  RD: { name: '無線', voice: 'Orus', style: STD + '50代の男性。タクシー会社の配車無線。事務的で、平坦で、感情のない話し方。' + PACE, model: m, fx: 'phone' },
  HB: { name: '灰原', voice: 'Algenib', style: STD + '40代の男性。低く、ゆっくり、親しげだが冷たい声。' + PACE, model: m, fx: 'msg' },
  X: { name: '', voice: 'Schedar', style: STD + '感情のない機械の読み上げ音声のように、平坦に、一定の速さで淡々と読む。', model: m, fx: 'robot' },
};
