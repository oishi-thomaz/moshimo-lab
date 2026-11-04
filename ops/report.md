# report：日報・週の振り返り（today.mjs に ■ report が出たとき。Opus のサブエージェント）

2026/11/05〜 日報は毎日 9:23 の運用の中で書き、13:00 の SNS司令室の昼のまとめに載る（数字はまとめ側が投稿サーバーから出すので、日報は 分かったこと・やったこと・お願い を書く）。12:58 までに push する。
集計は 8:45 の daily-prep.yml（collect・analyze.mjs・brief.mjs）が済ませて analysis/ に commit してある。今日の分がないときだけ自分で動かす。
today.mjs の行に出たアカウント・出たことだけやる。

## 1. もしもラボ
moshimo-analytics の ANALYST.md を読んで、毎朝の手順 の 3〜8 をやる（1・2 の用意と collect は済んでいる。analysis/YYYY-MM-DD.md がなければ `node tools/analyze.mjs ../moshimo-lab`）。reports/YYYY-MM-DD.md は 判断・打った手・仮説 だけを書けばよい（数字は analysis/ に残っているので書き写さない）。
バズ（today.mjs の バズ の行）があれば、ANALYST.md の 判断の基準 と 自分でやってよいこと のとおり手を打つ（派生の台本は make-moshimo の台本の候補として plan/scripts.md に足す。承認なしで動画にしない）。

## 2. クイズ・いつわ劇場（サーバー型）
1. analysis/<アカウント>-YYYY-MM-DD.md を読む（8:45 の daily-prep.yml が作っている。今日の分がなければ `node tools/brief.mjs <quiz|itsuwa>`）。notes/<アカウント>-insights.md と直近3日の reports/<アカウント>-YYYY-MM-DD.md も読む（なければ作る）。
2. 見る順番：平均視聴秒（動画の長さに対して）→ 保存・シェア → コメント（何秒でわかった？に答えてくれているか）→ 再生の伸び → フォロワーの増え方。1本の結果で決めつけない。
3. 打てる手：
   - クイズ：plan/quiz-queue.txt の、まだ書き出していない回の並びを変えてよい（番号は消さない）。伸びたジャンル・国・映画かドラマか、を notes/quiz-insights.md に書く（make-quiz がそれを読んで次の作品を選ぶ）。
   - いつわ劇場：伸びた話・離脱の多い話と、その理由の仮説を notes/itsuwa-insights.md に書く（make-itsuwa が次の作品の作りに使う）。
4. 日報を書く：reports/<アカウント>-YYYY-MM-DD.md に全文、reports/outbox/<アカウント>-YYYY-MM-DD.json に LINE 用のカード（形は ANALYST.md の 日報の書き方 と同じ。title は タイトル当てクイズ 日報 11/2 のように。at は書かなくてよい）。commit・push する（12:58 までに push すれば 13:00 の昼のまとめに載る。`node tools/run.mjs report <ファイル>` は 12:58 までなら何も送らずに終わるので、呼ばなくてよい）。
5. まだ数字がほとんどない日（投稿が少ない・インサイトが0）は、取れてない と正直に書いて短くする。QUIZ_AN・ITSUWA_AN が未設定で collect が落ちるときは、そのアカウントの日報は飛ばし、最後の返答に1行で書く。

## 3. 週の振り返り（today.mjs に 週の振り返り が出たとき。月曜。月曜に動けなかったら水曜まで）
- もしもラボは ANALYST.md の 毎週月曜の朝にやること。
- 収益化の条件：ops/reference.md の 収益化の条件 を見て、届きそうなものや申請できるものがあれば、そのアカウントの日報の お願い に1行で書く。
- 週の振り返りを SNS司令室に1通送る。reports/outbox/week-YYYY-MM-DD.json（YYYY-MM-DD はその週の月曜の日付。today.mjs はこの名前で済んだかを見る）に {"card": {"title": "週の振り返り M/D", "sections": [{"head": "<アカウント名>", "items": ["伸びた型（数字つき）", "やめる型", "来週の方針", "実際に変えたこと"]}, …3アカウント分]}} を書いて commit・push し、`node tools/run.mjs notice reports/outbox/week-YYYY-MM-DD.json`。収益化の条件（ops/reference.md の 収益化の条件）に近づいたアカウントがあれば、その数字も items に入れる。

最後の返答：アカウントごとに日報の要点1行（関西弁のタメ口）。
