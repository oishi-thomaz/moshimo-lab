// 置き配 の声（標準語）。ドラマ専用キーで Gemini 3.8 Flash TTS を使う
// ナレーター（次回予告の機械の声）＋登場人物ごとに別の声
export const STD = 'あなたはテレビドラマの俳優です。標準語（東京式アクセント）の自然な話し方で、実際のドラマのセリフとして演じてください。方言は使わないでください。';
export const TTS_MODEL = 'gemini-3.8-flash-tts';
export const TTS_FALLBACK = []; // 声が混ざらないよう同じモデルだけで作る
export const PACE = '会話は普通のドラマの速さで。ゆっくりすぎず、急ぎすぎず、言葉ははっきりと。';
const m = TTS_MODEL;
export const VOICES = {
  // 相沢ミオ（27）：心の声と、口に出すセリフ
  M: { name: '', voice: 'Despina', style: STD + '27歳の女性。ひとり暮らしの部屋で、自分の身に起きたことを語る心の声。落ち着いた声に、不安と緊張をにじませる。' + PACE, model: m },
  MS: { name: 'ミオ', voice: 'Despina', style: STD + '27歳の女性。目の前の相手に実際に話すセリフ。' + PACE, model: m },
  // 戸川（56）：管理会社の担当。親切で丁寧、低い声
  TG: { name: '戸川', voice: 'Sadaltager', style: STD + '56歳の男性。アパートの管理会社の担当。低く、丁寧で、親切そうな話し方。' + PACE, model: m },
  // 長瀬（34）：隣の部屋。夜勤明け。ぼそぼそ話す
  NG: { name: '長瀬', voice: 'Enceladus', style: STD + '34歳の男性。夜勤明けで疲れている。人と話すのが苦手で、低く、ぼそぼそと話す。' + PACE, model: m },
  // 水野サキ（27）：前の住人。第4話から電話の声
  SK: { name: 'サキ', voice: 'Achernar', style: STD + '27歳の女性。電話越しに、声をひそめて、でもはっきりと話す。おびえながらも、相手を助けようとしている。' + PACE, model: m, fx: 'phone' },
  // ケン（24）：配達員。明るい
  KN: { name: '配達員', voice: 'Puck', style: STD + '24歳の男性。宅配便の配達員。明るく、感じのいい話し方。' + PACE, model: m },
  // 管理会社の本社の人（第3話・電話）
  HQ: { name: '本社', voice: 'Vindemiatrix', style: STD + '40代の女性。会社の電話窓口。事務的で、ていねいに淡々と話す。' + PACE, model: m, fx: 'phone' },
  X: { name: '', voice: 'Schedar', style: STD + '感情のない機械の読み上げ音声のように、平坦に、一定の速さで淡々と読む。', model: m, fx: 'robot' },
};
