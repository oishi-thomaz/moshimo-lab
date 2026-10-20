# TikTok 予約投稿の手順（毎日の定期タスク用）

TikTok は個人では公式の投稿APIが使えない（法人の審査が必要）。なので、ゆうとの Mac の Chrome（Claude in Chrome）で TikTok Studio を開いて予約投稿する。
TikTok の予約は10日先まで入れられる。Mac が閉じていた日があっても、次に開いていた日にまとめて予約すれば穴はあかない。

## 0. 前提
- アカウントは個人アカウントのまま（Creator Rewards Program の対象にするため）。ビジネスアカウントへの切り替えや、設定の変更はしない。途中で出るお知らせは閉じる。コンテンツの自動チェックをオンにするかの確認はキャンセルする。
- ログインが切れていたら、パスワードは入力せずに止めて報告する。

## 0.5 収益化の状態を見る（最初に必ず）
- notes/tiktok-crp.md を読む。状態が 申請待ち か 審査中 なら、新しい予約はしない。
- そのときは TikTok Studio の投稿一覧で、まだ公開されていない予約済みの投稿を削除し（公開済みの投稿には絶対に触らない。notes/tiktok-crp.md に 残す と書いてある予約は消さない）、notes/tiktok-schedule.md のその行の状態を 取り消し（承認後に予約し直す） にして commit・push して終わる。報告は 収益化の審査待ちなので予約を止めた（取り消した回：…）。
- 状態が 承認 になっていたら、取り消し の回を先に、ふだん通り予約する。

## 1. 候補を決める（重複させないのが最優先）
1. `node tools/run.mjs collect` で最新の状態を取り込み、data/state.json の items から status が published の回を投稿順に並べる（インスタに出た回）。
2. notes/tiktok-schedule.md に載っている回（公開済み・予約済み・手動）を外す（取り消し の回は外さない）。
3. TikTok Studio の投稿一覧（https://www.tiktok.com/tiktokstudio/content）を get_page_text で読み、キャプション1行目が同じお題の投稿（公開済み・予約済み）があれば外す。ゆうとが手で上げた回もここで見つかる。見つけたら notes/tiktok-schedule.md に 手動（ゆうと） として足す。
4. 残った回が今回の候補。1日3本まで、枠は 12:00・19:00・21:30（日本時間）。すでに予約が入っている枠には入れない。10日先まで埋まっていたら何もしない。インスタで再生が多かった回から先に入れる（analysis の数字。なければ古い順）。

## 2. 動画を用意する
- `bash tools/tiktok-prep.sh 0003,0034` のように候補の番号をまとめて渡す。/mnt/user-data/outputs/tiktok/NNNN.mp4 ができる。SKIP_LONG と出た回（90秒超）は予約せず、日報の お願い にゆうとの手動投稿として書く（キャプションも添える）。
- Chrome の file_upload は /mnt/user-data/uploads の中のファイルしか受け付けない。次の順で移す：
  1. device_commit_files で /Users/yutooishi/Downloads/動画/TikTok用/NNNN_短い名前.mp4 に書く
  2. device_stage_files でそのファイルを取り込む → /mnt/user-data/uploads/動画/TikTok用/... に来る
  3. そのパスを file_upload に渡す

## 3. 予約する（1本ずつ）
1. https://www.tiktok.com/tiktokstudio/upload を開き、find で file input（type=file）を探して file_upload。
2. 説明欄（find で 説明 の combobox。最初はファイル名が入っている）をクリック → cmd+a → Delete → キャプションを打つ。改行は Return キー。打ち終わったら必ず zoom で全文を確認する（先頭や途中の文字が抜けることがある。抜けていたらその部分だけ直す）。
3. キャプションの形（今までの投稿にそろえる）：
   1行目：もしも○○したら…（絵文字1つ）＋数字の入ったひと言（結果のネタバレはしない）
   2行目：最後の質問＋コメントで教えて👇
   3行目：（必要なら ※注意書き）出典：主なものだけ短く
   4行目：#もしもラボ #もしも ＋お題のタグ2つ ＋ #雑学（5個）
   材料は moshimo-lab の engine/videos/NNNN.js の META（title・ask・caption・hashtags）。
4. 投稿のタイミングで 投稿予約する のラジオを押す（初回だけ 保存しますか？ の確認が出たら 許可する）。日付の欄・時刻の欄は find で ref を取ってクリックし、出てきたカレンダー・時刻リストを screenshot / zoom で見ながら選ぶ（時刻リストは数字をクリックするとその数字が真ん中に来る。毎回 zoom で今の値を確かめる）。
5. 公開範囲は 誰でも、ほかの設定はそのまま。下の 投稿予約する ボタンを押す。
6. 投稿一覧に戻ったら、その回の日時が正しいか確認する。
7. notes/tiktok-schedule.md の表に1行足す（番号・タイトル・日時・予約済み（日付 Claude））。

## 4. 後片付けと報告
- moshimo-analytics に commit・push（notes/tiktok-schedule.md）。
- 自分で開いたタブは閉じる。
- Chrome や Mac につながらない日は、何もせず つながらなかった とだけ返して終わる（次の日にまとめて予約する）。
