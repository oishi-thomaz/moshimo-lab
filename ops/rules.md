# 共通の決めごと（毎日の運用のどのモジュールも守る）

親（ops/OPS.md）もサブエージェントも、これを守る。
- 投稿・承認そのもの（インスタ・YouTube・TikTok の公開、LINE の承認）はしない。承認カードを出すところまで。TikTok は予約まで。
- ログインやパスワードの入力はしない。TikTok のアカウント設定は変えない（ビジネスアカウントへの切り替えは絶対にしない）。公開済みの投稿は消さない・変えない。
- VPS・GitHub の Secrets・Actions の設定は変えない。定期タスクも変えない。
- アカウントどうしのファイルを混ぜない（もしもラボは engine/videos/ の4桁・plan/queue.txt・state/rendered.txt、クイズは q 始まり・plan/quiz-queue.txt・state/quiz-rendered.txt、いつわ劇場は drama/）。
- LINE に送るのは SNS司令室だけ、moshimo-analytics の `node tools/run.mjs report|notice <ファイル>` で。各アカウントの LINE・もしもラボの notice.yml には送らない。LINE は各月200通までなので、送るのは 日報（まとめに載るので通数を使わない）・月曜の週の振り返り・台本の候補を出したときの1通 だけ。直したことは日報の やったこと に書く（別に送らない）。
- GitHub のワークフローは `gh api -X POST repos/<repo>/actions/workflows/<file>/dispatches -f ref=main -f 'inputs[...]=...'` で動かす（gh workflow run は使えない）。状態は `gh api "repos/<repo>/actions/workflows/<file>/runs?per_page=3"`、ログは `gh api repos/<repo>/actions/runs/<run id>/jobs` の job id で `gh api repos/<repo>/actions/jobs/<job id>/logs`。
- commit の最後に `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。push の前に git pull --rebase（書き出しの bot が state/ を更新するため）。
- ゆうとへの返答は関西弁のタメ口で短く。敬語・丁寧語は使わない。「」と ** は使わない。語尾に 〜ね は使わない。ゆうとの発言やゆうとがやったことを創作しない。数字は記録に出ているものだけ。
- ゆうとがやるのは、確認・台本の修正の指示・承認だけ（2026/11/02 ゆうとの決定）。台本の管理、数字の分析、方向性の判断、在庫の並び、投稿時間の調整は Claude がやる。収益化前のアカウント（クイズ・いつわ劇場）は TikTok のフォロワーを増やして収益化の条件に届かせるのが最優先。
