// 父のスマホ の声（標準語）。ドラマ専用キーで Gemini 3.8 Flash TTS を使う
// ナツキ（心の声と口に出すセリフ）＝同じ声。カズミはメッセージを読む声（第1〜3話）と、電話・目の前で話す声（第4話から）を同じ声で
export const STD = 'あなたはテレビドラマの俳優です。標準語（東京式アクセント）の自然な話し方で、実際のドラマのセリフとして演じてください。方言は使わないでください。';
export const TTS_MODEL = 'gemini-3.8-flash-tts';
export const TTS_FALLBACK = []; // 声が混ざらないよう同じモデルだけで作る
export const PACE = '会話は普通のドラマの速さで。ゆっくりすぎず、急ぎすぎず、言葉ははっきりと。';
const m = TTS_MODEL;
export const VOICES = {
  N: { name: '', voice: 'Aoede', style: STD + '34歳の女性。亡くなった父の部屋で、自分の身に起きたことを語る心の声。冷静で抑えた声に、不安と緊張をにじませる。' + PACE, model: m },
  NS: { name: 'ナツキ', voice: 'Aoede', style: STD + '34歳の女性。目の前の相手や電話の相手に実際に話すセリフ。はっきりした声。' + PACE, model: m },
  KM: { name: 'カズミ', voice: 'Erinome', style: STD + '50代の女性。スマホのメッセージを、そのまま読み上げるように。静かで、やさしく、でもどこか冷たい声。' + PACE, model: m, fx: 'msg' },
  KZ: { name: 'カズミ', voice: 'Erinome', style: STD + '52歳の女性。目の前の相手に、静かに、ゆっくり話す。やさしいが、何を考えているか分からない声。' + PACE, model: m },
  R: { name: 'リョウ', voice: 'Puck', style: STD + '19歳の男性。大学生。感情をおさえきれない、まっすぐな若い声。' + PACE, model: m },
  M: { name: '母', voice: 'Vindemiatrix', style: STD + '63歳の女性。足を悪くして施設で暮らす母。穏やかで弱々しいが、芯のある声。' + PACE, model: m, fx: 'phone' },
  T: { name: '父', voice: 'Enceladus', style: STD + '66歳の男性。穏やかで、少しかすれた、やさしい父親の声。' + PACE, model: m, fx: 'msg' },
  ST: { name: '施設の職員', voice: 'Laomedeia', style: STD + '30代の女性。介護施設の職員。電話で、あせりながらも丁寧に話す。' + PACE, model: m, fx: 'phone' },
  X: { name: '', voice: 'Schedar', style: STD + '感情のない機械の読み上げ音声のように、平坦に、一定の速さで淡々と読む。', model: m, fx: 'robot' },
};
