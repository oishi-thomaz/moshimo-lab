# moshimo-analytics（非公開）

もしもラボ（インスタ・TikTok・YouTube）の毎日の数字と、解析の日報を置くリポジトリ。

- data/ … VPS が毎時記録した数字（vps ワークフローの collect で取り込む）
- analysis/ … tools/analyze.mjs の集計結果
- reports/ … 毎日の日報（LINE に 8:00 に届く）
- notes/insights.md … 分かったこと・試していること
- ANALYST.md … 解析担当（Claude の定期タスク）の手順書

Secrets：MOSHIMO_AN（LINE のもしもラボ通知で 解析設定 と送ると値が届く）
