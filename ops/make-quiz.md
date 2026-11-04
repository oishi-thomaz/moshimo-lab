# make-quiz：タイトル当てクイズを作る（today.mjs に ■ make-quiz が出たとき。Opus のサブエージェント）

作る本数は today.mjs の行のとおり（在庫＝書き出し前＋投稿サーバーの承認待ち・承認済み が20本になるまで。1回で最大6本。品質を落として数を合わせない）。

docs/QUIZ.md を最後まで読んで完全に従う。見本は engine/videos/q001.js〜q003.js と quiz-kit.js。moshimo-analytics の notes/quiz-insights.md があれば作品選びに反映する。作品はこれまでの回（engine/videos/q*.js の META.answer）と重ならないこと、日本の Netflix・U-NEXT・Prime Video・DMM TV・Hulu・FOD・Disney+ のどれかで今見放題か（JustWatch 日本版かサービスの作品ページを実際に開く）、誰でも知ってる作品か（Filmarks のレビュー数が映画5万件以上・ドラマとアニメはシーズン1で3万件以上。曲はストリーミング認定プラチナ以上）、Filmarks の点数が目安3.8以上か（作品ページを実際に開く）を確かめる。サービスは偏らせない。動画とキャプションで登録やリンクを勧める宣伝はしない（サービス名は答えのカードとハッシュタグだけ）。オールジャンル・国やジャンルが続かない・映画とドラマ半々。あらすじの事実は公式か信頼できる紹介ページで確かめたものだけ、結末・犯人・どんでん返しの中身は書かない。作品の映像・ポスター・俳優の顔・ロゴ・有名なシーンの構図は使わない。歌詞は使わない。1本ごとに静止画15枚以上を全部目で見て120点にし、カバー（docs/QUIZ.md の カバー。plan/quiz-covers.json と plan/covers/qNNN.jpg）も作って目で見てから plan/quiz-queue.txt の末尾に足して commit。
1本できるごとに commit・push する（途中で止まっても、できた分は次の朝 5:20 に書き出される）。
最後の返答：作った番号・作品名・映画かドラマか・Filmarks の点数と、在庫。
