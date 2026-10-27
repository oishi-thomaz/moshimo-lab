// ホワイト案件の声（第3話から共通で使う）。大阪弁の指示は第2話で選んだ候補1（日本語の指示 × 2.5 Pro）
export const OSAKA_STYLE = 'あなたは大阪で生まれ育った大阪の人です。京阪式アクセントの、普段どおりの自然な大阪弁で話してください。標準語（東京式）のアクセントやイントネーションは絶対に使わないでください。「ほんま」「あかん」「やろ」「へん」「ねん」などは、大阪の人が日常で話す抑揚そのままで。お笑い芸人のような大げさな関西弁にはしないでください。';
export const TTS_MODEL = 'gemini-2.5-pro-preview-tts';
export const TTS_FALLBACK = []; // 声が混ざらないよう Pro だけで作る（1日50回。上限なら翌日に続きを作る）
export const PACE = '会話は普通のドラマの速さで。ゆっくりすぎず、急ぎすぎず。';
const m = TTS_MODEL;
export const VOICES = {
  Y: { name: '', voice: 'Achird', style: OSAKA_STYLE + '21歳の大学生の男性。自分の身に起きたことを、小さな声で緊張しながら語る心の声。' + PACE, model: m },
  S: { name: '坂口', voice: 'Charon', style: OSAKA_STYLE + '50代の男性。穏やかでやわらかい声のまま、静かに、ぞっとするほど落ち着いて話す。' + PACE, model: m },
  J: { name: 'ジン', voice: 'Algenib', style: OSAKA_STYLE + '20代半ばの無口な男。低くざらついた声で、言葉少なに静かに話す。' + PACE, model: m },
  K: { name: '', voice: 'Alnilam', style: OSAKA_STYLE + '40代の冷たい男。低く静かな声で話す。' + PACE, model: m, fx: 'msg' },
  M: { name: 'ミク', voice: 'Leda', style: OSAKA_STYLE + '15歳の中学3年の女の子。怖さをこらえて、小さな声で、でもしっかり話す。' + PACE, model: m },
  H: { name: '母', voice: 'Sulafat', style: OSAKA_STYLE + '48歳の母親。介護の仕事帰りで疲れているが、息子を心から心配している。やさしく、震える声で話す。' + PACE, model: m },
  P: { name: '警察官', voice: 'Orus', style: '大阪府警の40代の警察官。落ち着いた低い声で、はっきりと短く命令する。' + PACE, model: m },
};
