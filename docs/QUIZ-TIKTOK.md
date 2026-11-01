# タイトル当てクイズ TikTok 予約投稿の手順（毎日の定期タスク用）

TikTok は個人では公式の投稿APIが使えないので、ゆうとの Mac の Claude デスクトップアプリの中のブラウザ（built-in browser）で TikTok Studio を開いて予約投稿する。予約は10日先まで入れられる。

- Claude アプリのブラウザ ＝ @title_ate_quiz（タイトル当てクイズ）でログイン済み
- Chrome（Claude in Chrome）＝ @moshimo__lab（もしもラボ）。このタスクでは Chrome は絶対に使わない（開かない・操作しない）
- TikTok の web は1つのブラウザに1アカウントしか入れられない（切り替え機能はない）ので、この分け方を崩さない

## 0. 準備とアカウントの確認（最優先）
- ツールは mcp__remote-devices__Claude_Browser__* を使う（ToolSearch で `mcp__remote-devices__Claude_Browser__` をまとめて読み込む。enable__mcp__remote-devices__Claude_Browser しかなければ先にそれを呼ぶ）。操作の前に built-in-browser のスキルを読む。
- preview_start で https://www.tiktok.com/tiktokstudio/upload を開く（tabId を控える）。ブラウザの画面が隠れていても動くので、ゆうとに表示を頼まない。
- get_page_text で、プレビュー欄の名前が タイトル当てクイズ｜映画・ドラマ・曲 になっているか確かめる。違う名前・ログイン画面・パスワードを聞かれるときは、何もせず止めて報告する（ログインやパスワードの入力はしない）。
- アカウントは個人アカウントのまま。ビジネスアカウントへの切り替えや設定の変更はしない。途中のお知らせは閉じる。コンテンツの自動チェックをオンにするかの確認はキャンセルする。

## 1. 候補を決める（二重投稿させないのが最優先）
1. `gh workflow run quiz-status.yml -R oishi-thomaz/moshimo-lab` を実行し、終わったらログの QUIZ_STATUS_BEGIN〜END を読む（番号・状態・タイトル・投稿予定・投稿日時・インスタのURL）。状態が published の回（インスタに出た回）が候補。
2. state/quiz-tiktok.md に載っている回（予約済み・公開済み・手動）を外す。
3. TikTok Studio の投稿一覧（https://www.tiktok.com/tiktokstudio/content）を get_page_text で読み、キャプション1行目に同じ作品の手がかりがある投稿があれば外す。
4. 1日5本まで、枠は 12:30・15:30・18:30・20:30・22:30（日本時間）。すでに予約が入っている枠には入れない。10日先まで埋まっていたら何もしない。インスタに出た順に入れる。

## 2. 動画を Cloudinary に置く
TikTok Studio のページは決まった配信元からしか動画を読み込めない（投稿サーバーの sslip.io は読み込めない）。なので候補の動画をワークフローで Cloudinary（res.cloudinary.com）にも置く。
1. `gh workflow run quiz-cdn.yml -R oishi-thomaz/moshimo-lab -f ids="5001 5002"`（候補の番号をスペース区切りで）。
2. 終わったらログの `QUIZ_CDN 番号 URL` の行を読む。NG の回はこの日は予約しない。CLOUDINARY_URL 未設定で落ちたときは、予約せずその旨だけ報告して終わる。
3. 説明は投稿サーバーの json：`curl -fsS https://133-88-122-181.sslip.io/quiz/media/5001.json`（answer・title・caption・hashtags）。

## 3. 予約する（1本ずつ）
1. https://www.tiktok.com/tiktokstudio/upload を開き直す（navigate）。javascript_tool で次を実行して動画を入れる（URL は QUIZ_CDN の行のもの）：
   ```js
   const url = 'https://res.cloudinary.com/.../quiz/5001.mp4';
   const blob = await (await fetch(url)).blob();
   const file = new File([blob], '5001.mp4', { type: 'video/mp4' });
   const inp = document.querySelector('input[type=file]');
   const dt = new DataTransfer(); dt.items.add(file); inp.files = dt.files;
   inp.dispatchEvent(new Event('change', { bubbles: true }));
   await new Promise(r => setTimeout(r, 15000));
   ({ size: blob.size, text: document.body.innerText.slice(0, 300) })
   ```
   input[type=file] が見つからないときは数秒待ってからもう一度。アップロード完了 の表示が出るまで待つ（get_page_text で確認）。
2. 説明欄をクリック → cmd+a → Delete → キャプションを打つ（computer の type。改行は key Return）。最初はファイル名が入っているので必ず消す。打ち終わったら zoom で全文を確認する。
3. キャプションの形（答えは絶対に書かない）：
   1行目：json の title（このドラマのタイトルは？ など）＋🎬
   2行目：何秒で、どこでわかった？コメントで教えて👇
   3行目：#タイトル当てクイズ ＋ json の hashtags の2つ目以降から4つ（合わせて5個まで）
4. 投稿予約する のラジオを押し、日付と時刻を選ぶ（毎回 zoom で今の値を確かめる）。公開範囲は 誰でも。投稿予約する のボタンを押す。
5. 投稿一覧でその回の日時が正しいか確認する。
6. state/quiz-tiktok.md の表に1行足す（番号・作品名・日時・予約済み（日付 Claude））。

途中でやめるときは、アップロード中の動画を 破棄 する（破棄 → 確認の 破棄）。下書きや予約を残しっぱなしにしない。

## 4. 後片付けと報告
- moshimo-lab に commit・push（state/quiz-tiktok.md）。
- 自分で開いたタブは閉じる（最後の1枚は閉じなくてよい）。
- Claude アプリのブラウザにつながらない日（Mac が寝ている・アプリが閉じている）は、何もせず つながらなかった とだけ返して終わる（次の日にまとめて予約する）。
