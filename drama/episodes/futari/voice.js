// 二人の息子 の声（標準語）。ドラマ専用キーで Gemini 3.8 Flash TTS を使う
// ハルトは本物も偽物も同じ声（同じ声だから見分けがつかない、が作品の芯）
export const STD = 'あなたはテレビドラマの俳優です。標準語（東京式アクセント）の自然な話し方で、実際のドラマのセリフとして演じてください。方言は使わないでください。';
export const TTS_MODEL = 'gemini-3.8-flash-tts';
export const TTS_FALLBACK = [];
export const PACE = '会話は普通のドラマの速さで。ゆっくりすぎず、急ぎすぎず、言葉ははっきりと。';
const m = TTS_MODEL;
const HARUTO = STD + '29歳の男性。母親に電話で話す息子。' ;
export const VOICES = {
  S: { name: '', voice: 'Sulafat', style: STD + '58歳の女性。夜中にひとり、自分の身に起きたことを語る心の声。落ち着いた低めの声に、緊張と不安をにじませる。' + PACE, model: m },
  SS: { name: '佐和子', voice: 'Sulafat', style: STD + '58歳の女性。電話の相手に実際に話すセリフ。母親らしい、はっきりした声。' + PACE, model: m },
  H1: { name: 'ハルト', voice: 'Iapetus', style: HARUTO + '取り乱して、泣きそうな声。' + PACE, model: m, fx: 'phone' },
  H2: { name: 'ハルト', voice: 'Iapetus', style: HARUTO + '必死に、早く伝えようとする声。' + PACE, model: m, fx: 'phone' },
  L: { name: '弁護士', voice: 'Rasalgethi', style: STD + '50代の男性。弁護士を名乗る、丁寧で落ち着いた、冷たい声。' + PACE, model: m, fx: 'phone' },
  T: { name: '警察官', voice: 'Orus', style: STD + '40代の男性警察官。夜中のインターホン越しに、低く落ち着いて話す。' + PACE, model: m, fx: 'door' },
  X: { name: '', voice: 'Schedar', style: STD + '感情のない機械の読み上げ音声のように、平坦に、一定の速さで淡々と読む。', model: m, fx: 'robot' },
};
