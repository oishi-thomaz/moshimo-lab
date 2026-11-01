# タイトル当てクイズ（@title_ate_quiz）の作り方と自動投稿

映画・ドラマ（ゆくゆくは曲も）のタイトル当てクイズを、もしもラボのエンジンで3Dの約64秒動画にして、インスタとTikTokに出す。もしもラボ・いつわ劇場とは別のアカウント・別のサーバー・別のLINE。

## 全体の流れ

```
毎週   Claude が次の回（engine/videos/qNNN.js）を作って plan/quiz-queue.txt に足す
毎朝   Claude の定期タスクが quiz-render を動かす → 5本書き出し → タイトル当てクイズの投稿サーバー（VPS /quiz/）へ送る
VPS    届いた順に LINE（タイトル当てクイズ通知）に承認カード → 承認すると 12:00・15:00・18:00・20:00・22:00 の空いている枠でインスタに投稿
TikTok Claude の定期タスクが Mac の Claude アプリのブラウザ（@title_ate_quiz でログイン済み）で TikTok Studio に予約投稿。動画は quiz-cdn ワークフローで Cloudinary に置いてから取り込む（docs/QUIZ-TIKTOK.md）。Chrome はもしもラボ用なので使わない
```

投稿サーバーでの番号は 5000＋回の番号（q001 → 5001）。LINE のカードのタイトルには答えが付く（例 地面師たち｜このドラマのタイトルは？）。

## 1本の作り方

- 見本：engine/videos/q001.js（地面師たち）、q002.js（シャッター アイランド）、q003.js（ペーパー・ハウス）。共通部品は engine/videos/quiz-kit.js（quizStage・tag・countdown・applyQuizCards）
- 作品の条件：日本の Netflix で今見放題（JustWatch 日本版か netflix.com/jp/title で確認）。Filmarks の作品ページを開いて点数を確認（目安 3.8 以上）。オールジャンル（どんでん返しだけにしない）
- 作品の映像・ポスター・俳優の顔・ロゴは使わない。設定だけを汎用の3D（makePerson など）で見せる。有名なシーンの構図をなぞらない。結末・犯人・どんでん返しの中身は絶対に言わない
- 構成（64秒）：0〜9 冒頭（0秒目がサムネ。タイトルは このドラマ／この映画のタイトルは？）／9〜42 設定を4段階で見せる／42〜49 ひねり（観たくなる一言。ネタバレしない）／49〜56 この作品、わかった？ と カウントダウンの間に当ててみて＋3・2・1／56〜64 答えのカード
- 答えのあとの呼びかけは 何秒で、どこでわかった？ と 感想も聞かせて。答えの前に コメントで答えて とは言わない
- META：id・v2: true・answer（作品名）・title・titleHtml・mood・seed・hits・impacts・sfx・narr（読み方）・caption・hashtags（1つ目は タイトル当てクイズ）
- 歌詞は使わない（著作権）。曲の回を作るときは、リリース年・主題歌になったドラマ・MVの設定・売れた数などのヒントで曲名を当てる形にする
- 確認：`CHROME_PATH=<chrome> node tools/render.mjs --video qNNN --stills 0,0.4,3,10,15,19,23,27,31,35,40,44,47,51,58 --outdir out/stills` の静止画を全部見る（主役が隠れていないか・文字と札がかぶっていないか・札が画面から切れていないか）
- できたら plan/quiz-queue.txt の末尾に番号を足して main に push

## 自動投稿のセットアップ（1回だけ）

1. Instagram：@title_ate_quiz をプロアカウントにする → developers.facebook.com のもしもラボのアプリ → Instagram → API setup with Instagram business login → アカウントを追加 → Generate token → `https://graph.instagram.com/v25.0/me?fields=user_id,username&access_token=TOKEN` で user_id を控える
2. LINE：LINE Developers で新しい Messaging API チャネル（タイトル当てクイズ通知）→ チャネルシークレットと長期のチャネルアクセストークンを控える → 応答メッセージはオフ
3. VPS（Mac のターミナルから ssh で入る）：`curl -fsSL https://raw.githubusercontent.com/oishi-thomaz/moshimo-lab/main/server/install-quiz.sh -o install-quiz.sh && sudo bash install-quiz.sh` → `sudo nano /etc/quiz.env` に LINE と IG の値を入れる → `sudo systemctl restart quiz`
4. LINE の Webhook URL に `https://ドメイン/quiz/line/webhook` を入れてオン → 公式アカウントを友だち追加して何か送る
5. GitHub の Secrets に QUIZ_BASE_URL（https://ドメイン/quiz）と QUIZ_SECRET（install-quiz.sh の最後に出た HOOK_SECRET）
6. Actions → quiz-render → Run workflow（count 1）で試す
7. TikTok：Mac の Claude アプリのブラウザに @title_ate_quiz でログイン（済み）。Chrome は @moshimo__lab のまま。Cloudinary の無料アカウントを作り、API environment variable（cloudinary://…）を GitHub の Secrets に CLOUDINARY_URL として登録する
