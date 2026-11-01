# タイトル当てクイズ TikTok 予約投稿の手順（毎日の定期タスク用）

TikTok は個人では公式の投稿APIが使えないので、ゆうとの Mac の Chrome（Claude in Chrome）で TikTok Studio を開いて予約投稿する。もしもラボ（docs は moshimo-analytics の TIKTOK.md）と同じやり方。予約は10日先まで入れられる。

## 0. アカウントの確認（最優先。もしもラボと取り違えない）
- 同じ Chrome にもしもラボの TikTok（@moshimo__lab）も入っている。https://www.tiktok.com/tiktokstudio を開き、右上のアカウント（プロフィール）で今ログインしているのが @title_ate_quiz か必ず確かめる。
- @moshimo__lab になっていたら、アカウントの切り替えで @title_ate_quiz にする。切り替え先に出てこない・パスワードを聞かれるときは、何もせず止めて報告する（パスワードは入力しない）。
- 作業が終わったら、最後に必ず @moshimo__lab に切り替えて戻す（もしもラボの予約係が21:10に動くため）。
- アカウントは個人アカウントのまま。ビジネスアカウントへの切り替えや設定の変更はしない。途中のお知らせは閉じる。コンテンツの自動チェックをオンにするかの確認はキャンセルする。

## 1. 候補を決める（二重投稿させないのが最優先）
1. `gh workflow run quiz-status.yml -R oishi-thomaz/moshimo-lab` を実行し、終わったらログの QUIZ_STATUS_BEGIN〜END を読む（番号・状態・タイトル・投稿予定・投稿日時・インスタのURL）。状態が published の回（インスタに出た回）が候補。
2. state/quiz-tiktok.md に載っている回（予約済み・公開済み・手動）を外す。
3. TikTok Studio の投稿一覧（https://www.tiktok.com/tiktokstudio/content）を get_page_text で読み、キャプション1行目に同じ作品の手がかりがある投稿があれば外す。
4. 1日5本まで、枠は 12:30・15:30・18:30・20:30・22:30（日本時間）。すでに予約が入っている枠には入れない。10日先まで埋まっていたら何もしない。インスタに出た順に入れる。

## 2. 動画を用意する
- 動画は投稿サーバーから取れる：`curl -fsS -o /mnt/user-data/outputs/tiktok-quiz/5001.mp4 https://133-88-122-181.sslip.io/quiz/media/5001.mp4`。説明は同じ場所の 5001.json（answer・title・caption・hashtags）。
- Chrome の file_upload は /mnt/user-data/uploads の中のファイルしか受け付けないので、もしもラボと同じ順で移す：
  1. device_commit_files で /Users/yutooishi/Downloads/動画/TikTok用/クイズ/5001_作品名.mp4 に書く
  2. device_stage_files でそのファイルを取り込む → /mnt/user-data/uploads/... に来る
  3. そのパスを file_upload に渡す

## 3. 予約する（1本ずつ）
1. https://www.tiktok.com/tiktokstudio/upload を開き、find で file input を探して file_upload。
2. 説明欄をクリック → cmd+a → Delete → キャプションを打つ。改行は Return。打ち終わったら zoom で全文を確認する。
3. キャプションの形（答えは絶対に書かない）：
   1行目：json の title（このドラマのタイトルは？ など）＋🎬
   2行目：何秒で、どこでわかった？コメントで教えて👇
   3行目：#タイトル当てクイズ ＋ json の hashtags の2つ目以降から4つ（合わせて5個まで）
4. 投稿予約する のラジオを押し、日付と時刻を選ぶ（毎回 zoom で今の値を確かめる）。公開範囲は 誰でも。投稿予約する を押す。
5. 投稿一覧でその回の日時が正しいか確認する。
6. state/quiz-tiktok.md の表に1行足す（番号・作品名・日時・予約済み（日付 Claude））。

## 4. 後片付けと報告
- TikTok を @moshimo__lab に切り替えて戻したことを確認する。
- moshimo-lab に commit・push（state/quiz-tiktok.md）。
- 自分で開いたタブは閉じる。
- Chrome や Mac につながらない日は、何もせず つながらなかった とだけ返して終わる（次の日にまとめて予約する）。
