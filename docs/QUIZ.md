# タイトル当てクイズ（@title_ate_quiz）の作り方と自動投稿

映画・ドラマ（ゆくゆくは曲も）のタイトル当てクイズを、もしもラボのエンジンで3Dの約64秒動画にして、インスタとTikTokに出す。もしもラボ・いつわ劇場とは別のアカウント・別のサーバー・別のLINE。

## 全体の流れ

```
毎週   Claude が次の回（engine/videos/qNNN.js）を作って plan/quiz-queue.txt に足す
毎朝   Claude の定期タスク（ops/OPS.md の 朝の仕事）が quiz-render を動かす → 5本書き出し → タイトル当てクイズの投稿サーバー（VPS /quiz/）へ送る
VPS    届いた順に LINE（タイトル当てクイズ通知）に承認カード → 承認すると 12:00・15:00・18:00・20:00・22:00 の空いている枠でインスタに投稿
TikTok Claude の定期タスクが Mac の Claude アプリのブラウザ（@title_ate_quiz でログイン済み）で TikTok Studio に予約投稿。動画は quiz-cdn ワークフローで Cloudinary に置いてから取り込む（docs/QUIZ-TIKTOK.md）。Chrome はもしもラボ用なので使わない
```

投稿サーバーでの番号は 5000＋回の番号（q001 → 5001）。LINE のカードのタイトルには答えが付く（例 地面師たち｜このドラマのタイトルは？）。

## 1本の作り方

- 見本：engine/videos/q001.js（地面師たち）、q002.js（シャッター アイランド）、q003.js（ペーパー・ハウス）。共通部品は engine/videos/quiz-kit.js（quizStage・tag・countdown・applyQuizCards）
- 作品の条件（2026/11/02 ゆうと決定）：
  - 日本の Netflix・U-NEXT・Prime Video・DMM TV・Hulu・FOD・Disney+ のどれかで今見放題（JustWatch 日本版か、そのサービスの作品ページを実際に開いて確認。レンタル・購入だけのものは不可）
  - 誰でも知ってる作品だけ（マイナーな作品は誰もわからんくて離脱するので、最初は絶対に避ける）。目安は Filmarks の作品ページのレビュー数：映画は5万件以上、ドラマ・アニメはシーズン1で3万件以上（例：パラサイト 41万・ドント・ルック・アップ 8.8万・梨泰院クラス 8.9万・ウェンズデー 5.2万は OK、西部戦線異状なし 2.5万・Lupin 1.4万・舞妓さんちのまかないさん 1.3万・クロース 6,648 は NG）。曲は日本レコード協会のストリーミング認定でプラチナ（1億回）以上
  - Filmarks の点数は目安 3.8 以上。オールジャンル（どんでん返しだけにしない）
  - 配信サービスは偏らせない（U-NEXT・Prime Video・DMM TV などの作品も混ぜる）
- 答えのカードの info には、見放題のサービス名を今まで通り書く（例 U-NEXT｜韓国ドラマ・全16話。2つ以上で見放題なら2つまで 例 U-NEXT・Prime Video｜映画・132分）。ハッシュタグの配信サービスのタグもその作品のサービスに合わせる
- 動画・字幕・ナレーション・キャプションで、登録やリンクを勧めるような宣伝じみたことは言わない・書かない（ゆうとの決定。サービス名を出すのは答えのカードの info とハッシュタグだけ）
- 作品の映像・ポスター・俳優の顔・ロゴは使わない。設定だけを汎用の3D（makePerson など）で見せる。有名なシーンの構図をなぞらない。結末・犯人・どんでん返しの中身は絶対に言わない
- 構成（64秒）：0〜49 ヒント6段／49〜56 この作品、わかった？ と カウントダウンの間に当ててみて＋3・2・1／56〜64 答えのカード
- ヒント6段（2026/11/2 ゆうとの決定）：最初はなんやろこれ？で、後半につれてわかりやすくなる順に出す。1段は約8秒・字幕2行・ショット1つ。
  1. 0〜9 誰にでも起こりそうな、気になる出来事（0秒目がサムネ。タイトルは このドラマ／この映画のタイトルは？）。何か起きている感じは最初から出す（ぼかしすぎて退屈にしない）
  2. 9〜17 主人公の状況
  3. 17〜25 舞台の空気（国名・地名はまだ出さない）
  4. 25〜33 人間関係や目的
  5. 33〜42 ジャンルや国がわかってくる
  6. 42〜49 その作品だけの決め手（これを見たらわかる、という特徴。観たくなる一言を兼ねる。ネタバレはしない）
- その作品だけの特徴（パラグライダーで境界線を越える、のような決め手）は6段目まで出さない。作品名・登場人物の名前・固有の地名・看板や札の文字も、字幕だけでなく映像・3Dの小物でも前半に出さない。キャプション（caption）も1〜3段目くらいのぼかしたヒントだけにして、決め手は書かない
- 答えのあとの呼びかけは 何秒で、どこでわかった？ と 感想も聞かせて。答えの前に コメントで答えて とは言わない
- META：id・v2: true・answer（作品名）・title・titleHtml・mood・seed・hits・impacts・sfx・narr（読み方）・caption・hashtags（1つ目は タイトル当てクイズ）
- 歌詞は使わない（著作権）。曲の回を作るときは、リリース年・主題歌になったドラマ・MVの設定・売れた数などのヒントで曲名を当てる形にする
- 確認：`CHROME_PATH=<chrome> node tools/render.mjs --video qNNN --stills 0,0.4,3,10,15,19,23,27,31,35,40,44,47,51,58 --outdir out/stills` の静止画を全部見る（主役が隠れていないか・文字と札がかぶっていないか・札が画面から切れていないか）
- カバー（表紙 1080x1920。2026/11/03 ゆうとの決定）：plan/quiz-covers.json に {"qNNN": {"t": 場面の秒数, "text": "1行目|2行目|3行目"}} を足す。書き出し（tools/build.sh）が tools/make_quiz_cover.py で作り、投稿サーバーがインスタに cover_url で付ける
  - 上の札は種類で色分け：この映画なに？＝赤、このドラマなに？＝青、この曲なに？＝緑（META.title の この映画／このドラマ／この曲 から自動）
  - 大きい字は答えがわからない程度のキャッチコピー（1〜3段目の中身から。決め手・国名・作品名・人物名は書かない）。3行・1行6文字前後まで（長い行があると全部の字が小さくなる）。最後の行が黄色
  - 場面は1〜3段目の、その回にしかない絵。`node tools/render.mjs --video qNNN --stills 1,4,7,11,15 --glonly --outdir out/cv/qNNN` で見て選ぶ。札（tag）とコピーが同じ言葉にならない秒を選ぶ
  - 作ったら `python3 tools/make_quiz_cover.py qNNN 絵.jpg plan/covers/qNNN.jpg` で一度作って目で見る（plan/covers/qNNN.jpg があれば書き出しはそれを使う）
  - 書き出し済みの回のカバーだけ差し替えるときは plan/covers/qNNN.jpg を更新して cover-upload ワークフロー（inputs[ids]=q010,q011）
- できたら plan/quiz-queue.txt の末尾に番号を足して main に push

## 自動投稿のセットアップ（1回だけ）

1. Instagram：@title_ate_quiz をプロアカウントにする → developers.facebook.com のもしもラボのアプリ → Instagram → API setup with Instagram business login → アカウントを追加 → Generate token → `https://graph.instagram.com/v25.0/me?fields=user_id,username&access_token=TOKEN` で user_id を控える
2. LINE：LINE Developers で新しい Messaging API チャネル（タイトル当てクイズ通知）→ チャネルシークレットと長期のチャネルアクセストークンを控える → 応答メッセージはオフ
3. VPS（Mac のターミナルから ssh で入る）：`curl -fsSL https://raw.githubusercontent.com/oishi-thomaz/moshimo-lab/main/server/install-quiz.sh -o install-quiz.sh && sudo bash install-quiz.sh` → `sudo nano /etc/quiz.env` に LINE と IG の値を入れる → `sudo systemctl restart quiz`
4. LINE の Webhook URL に `https://ドメイン/quiz/line/webhook` を入れてオン → 公式アカウントを友だち追加して何か送る
5. GitHub の Secrets に QUIZ_BASE_URL（https://ドメイン/quiz）と QUIZ_SECRET（install-quiz.sh の最後に出た HOOK_SECRET）
6. Actions → quiz-render → Run workflow（count 1）で試す
7. TikTok：Mac の Claude アプリのブラウザに @title_ate_quiz でログイン（済み）。Chrome は @moshimo__lab のまま。Cloudinary の無料アカウントを作り、API environment variable（cloudinary://…）を GitHub の Secrets に CLOUDINARY_URL として登録する
