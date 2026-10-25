// 大阪弁のイントネーション比べ（指示の書き方 × モデル）
const EN = 'You are a native speaker born and raised in Osaka. Speak with a natural, authentic Osaka (Kansai) pitch accent and intonation, exactly like a local Osaka person. Never use standard Tokyo intonation. ';
const JA = 'あなたは大阪で生まれ育った大阪の人です。京阪式アクセントの、普段どおりの自然な大阪弁で話してください。標準語（東京式）のアクセントやイントネーションは絶対に使わないでください。「ほんま」「あかん」「やろ」「へん」「ねん」などは、大阪の人が日常で話す抑揚そのままで。お笑い芸人のような大げさな関西弁にはしないでください。';
const ROLE = {
  Y: ['A 21-year-old college man, quiet and tense, talking to himself.', '21歳の大学生の男性。小さな声で、緊張しながら独り言のように話す。'],
  K: ['A cold, quiet man in his 40s threatening someone. Calm, low and unsettling.', '40代の冷たい男。低く静かな声で、落ち着いて相手を脅す。'],
  S: ['A gentle, kind man in his 50s, soft and warm.', '50代の穏やかで優しい男性。やわらかく温かい声で話す。'],
};
const V = { Y: 'Achird', K: 'Alnilam', S: 'Charon' };
const T = {
  Y: 'ほんまにあかんて。なんでこんなことになってしもたんやろ。オカンには、絶対言われへん。',
  K: 'お前、ほんまにわかってへんな。もう逃げられへんねん。番号、知っとるやろ。',
  S: 'よう話してくれたな。しんどかったやろ。明日の朝、一緒に警察行こか。',
};
const VARIANTS = [
  ['1', 'gemini-2.5-pro-preview-tts', 1],
  ['2', 'gemini-2.5-pro-preview-tts', 0],
  ['3', 'gemini-2.5-flash-preview-tts', 1],
];
export const CAST = {};
export const LINES = [];
for (const [tag, model, lang] of VARIANTS) for (const who of ['Y', 'K', 'S']) {
  const key = `${tag}${who}`;
  CAST[key] = { voice: V[who], style: lang ? JA + ROLE[who][1] : EN + ROLE[who][0], model };
  LINES.push({ id: `${tag}_${who}`, who: key, text: T[who] });
}
