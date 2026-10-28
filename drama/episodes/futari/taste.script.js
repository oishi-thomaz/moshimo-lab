// 二人の息子 — 映像テイスト確認用（声なし・字幕だけ）
export const SERIES = { title: '二人の息子', account: 'いつわ劇場', total: 5 };
export const EPISODE = { no: 1, title: '着信', next: '警察官', ask: '本物のハルトはどっち？ コメントで予想して' };
export const CAST = { S: { name: '', voice: 'Kore', style: '' }, H: { name: 'ハルト', voice: 'Puck', style: '' }, T: { name: 'タカギ', voice: 'Charon', style: '' } };
export const LINES = [
  { id: 'a1', who: 'S', text: '午前2時13分。／息子から、電話が鳴った。', gap: 0.4 },
  { id: 'a2', who: 'H', text: '母さん…俺、[[r:人をはねた]]。', gap: 0.4 },
  { id: 'a3', who: 'S', text: 'その時、もう1本。／[[r:同じ名前]]の着信が鳴った。', gap: 0.4 },
  { id: 'a4', who: 'T', text: '夜分にすみません。／息子さんの事故の件で。', gap: 0.4 },
  { id: 'a5', who: 'S', text: '声なんて、30秒あれば作れる。', gap: 0.4 },
  { beat: 'title', dur: 2.4 },
  { beat: 'end', dur: 3.2 },
];
