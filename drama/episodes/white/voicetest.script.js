// カラスの声の聞き比べ用（大阪弁のイントネーション確認）
const OSAKA = 'You are a native speaker born and raised in Osaka. Speak with a natural, authentic Osaka (Kansai) pitch accent and intonation, exactly like a local Osaka man. Never use standard Tokyo intonation. ';
const KARASU = 'A cold, quiet man in his 40s threatening someone over the phone. Calm, low, slow and unsettling. Not robotic, not exaggerated.';
const T = 'お前はもう共犯やで。逃げられへんで。次の仕事や。金庫の番号は、お前が知っとるやろ。';
export const CAST = {
  a: { voice: 'Charon', style: OSAKA + KARASU },
  b: { voice: 'Algenib', style: OSAKA + KARASU },
  c: { voice: 'Alnilam', style: OSAKA + KARASU },
  d: { voice: 'Iapetus', style: OSAKA + KARASU },
  e: { voice: 'Rasalgethi', style: OSAKA + KARASU },
  y1: { voice: 'Puck', style: OSAKA + 'A 21-year-old college man, scared and confused, talking to himself quietly.' },
  y2: { voice: 'Fenrir', style: OSAKA + 'A 21-year-old college man, scared and confused, talking to himself quietly.' },
  y3: { voice: 'Achird', style: OSAKA + 'A 21-year-old college man, scared and confused, talking to himself quietly.' },
};
const Y = 'なんでやねん。ここ、俺の実家やんけ。こんなん、行けるわけないやろ。';
export const LINES = [
  { id: 'karasu_a_Charon', who: 'a', text: T },
  { id: 'karasu_b_Algenib', who: 'b', text: T },
  { id: 'karasu_c_Alnilam', who: 'c', text: T },
  { id: 'karasu_d_Iapetus', who: 'd', text: T },
  { id: 'karasu_e_Rasalgethi', who: 'e', text: T },
  { id: 'yuuma_1_Puck', who: 'y1', text: Y },
  { id: 'yuuma_2_Fenrir', who: 'y2', text: Y },
  { id: 'yuuma_3_Achird', who: 'y3', text: Y },
];
