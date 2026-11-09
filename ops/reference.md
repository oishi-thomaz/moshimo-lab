# 参考（要るときだけ読む。毎回は読まない）

ops/OPS.md から外した、アカウントと仕組みの細かいこと。2026/11/05 に旧 OPS.md から移した。

## アカウント一覧

| アカウント | 中身 | 投稿 | 在庫の数え方 | 作り方 | 書き出し | 解析・日報 | TikTok |
|---|---|---|---|---|---|---|---|
| もしもラボ（moshimo、@moshimo__lab） | もしも○○したら？の3D解説（約60秒） | 1日4本 12:00・16:00・19:00・22:00（インスタ・YouTube 自動。2026/11/03〜） | plan/queue.txt にあって state/rendered.txt にない本数 | ops/make-moshimo.md（docs/PRODUCTION.md・plan/STRATEGY.md・plan/RULES.md） | render-chain.yml が daily-render.yml を毎朝4本（ops/render.json） | moshimo-analytics の ANALYST.md | moshimo-analytics の TIKTOK.md（Chrome・Claude in Chrome） |
| タイトル当てクイズ（quiz、@title_ate_quiz） | 映画・ドラマのタイトル当て3D（約64秒） | 1日5本 12:00・15:00・18:00・20:00・22:00（立ち上げの1か月） | plan/quiz-queue.txt にあって state/quiz-rendered.txt にない本数 | ops/make-quiz.md（docs/QUIZ.md） | render-chain.yml が quiz-render.yml を毎朝5本 | ops/report.md の サーバー型 | moshimo-analytics の TIKTOK.md の 5（Chrome のクイズ用プロフィール。2026/11/09〜。下書きに送る仕組みはやめた） |
| いつわ劇場（itsuwa、@itsuwa_drama） | 1話3分・全5話のショートドラマ | 1日1話 20:00 | docs/ITSUWA-AUTO.md の 1 | ops/make-itsuwa.md（docs/ITSUWA-AUTO.md） | なし（作った話をその場で送る） | ops/report.md の サーバー型 | moshimo-analytics の TIKTOK.md の 5（Chrome のいつわ劇場用プロフィール。2026/11/09〜。下書きに送る仕組みはやめた） |

各アカウントの投稿サーバー（VPS）は別々。承認はゆうとが SNS司令室（LINE）の 承認待ち ボタンからする（2026/11/02〜。承認・修正の指示・却下・まとめて承認がそこでできる）。各アカウントの LINE は QUIET=1 で、投稿サーバーが自分から送るのは 承認待ちがそろった（1回の書き出しで1通。2026/11/09〜）・バズ・接続切れ だけ。そのアカウントの LINE からも承認・修正・却下・台本の返事ができる。

## ゆうとの役割と Claude の役割（2026/11/02 ゆうとの決定）
- ゆうとがやるのは、確認・台本の修正の指示・承認だけ。台本の管理、数字の分析、方向性の判断、在庫の並び、投稿時間の調整は Claude が全部やる。収益化前のアカウント（クイズ・いつわ劇場）は、TikTok のフォロワーを増やして収益化の条件に届かせるのが最優先。
- 修正の指示（ops/feedback.md）は、何よりも先にやる。
- 完全にバズった動画（インスタか TikTok で1時間に もしもラボ +1万再生／クイズ・いつわ劇場 +3,000再生。そのあと累計10万・30万・100万）は、投稿サーバーがそのアカウントの LINE にすぐ知らせる（2026/11/02 ゆうとと決めた条件）。記録は投稿サーバーの state.an.buzz と、export の alerts。毎日の運用の report・make-moshimo は、バズった動画があればその型の派生を在庫の前に出す。
- LINE の無料の送信枠（各アカウント月200通）を守る。Claude から送るのは SNS司令室だけで、1日3回のまとめ（Actions）・月曜の週の振り返り・台本の候補を出したときの1通だけ。ほかはゆうとがメニューのボタンで取りに来る（返事は数えない）。

## 連絡は SNS司令室 にまとめる（2026/11/02〜）
- 日報・連絡は、全部 SNS司令室（まとめ用の LINE 公式アカウント。Secrets の SNS_LINE_TOKEN）に送る。Claude から各アカウントの LINE には何も送らない（ゆうとの決定。各アカウントの LINE に届くのは承認カードと、投稿サーバー自身の通知だけ）。
- 送り方は moshimo-analytics の `node tools/run.mjs report <ファイル>`（または `notice`）。日報（reports/outbox/YYYY-MM-DD.json・quiz-…・itsuwa-…）は、7:58 までに push してあれば 8:00 のまとめに、12:58 までなら 13:00 の昼のまとめに入る（別には送らない。2026/11/05〜 毎日の運用は 9:23 なので昼のまとめに載る）。notice で送るものはその場で SNS司令室に届く（今月の残りが15通を切ったら送らない）。JSON の形は ANALYST.md の 日報の書き方 と同じ（{card} か {message}）。
- もしもラボの notice.yml・投稿サーバーの report は使わない（各アカウントの LINE に行くため）。
- SNS司令室に ストック と送ると、まだ投稿していない動画（予約済み・承認待ち・書き出し前の在庫）が3アカウント分カードで返ってくる。返事係は VPS の server/sns-server.mjs（install-sns.sh で入れる。/var/lib/moshimo・quiz・itsuwa の state.json と、このリポジトリの在庫を読むだけ）。
- 4つの LINE（SNS司令室・各アカウント）には下にボタンのメニューがある（server/setup-richmenu.mjs で入れる。画像は server/richmenu/）。SNS司令室：ストック・承認待ち・今日の投稿・いま回ってる・いまの数字・使い方。各アカウント：承認待ち（そのアカウントの動画と台本）・今日の投稿・数字・収益（もしもラボ）／通数（クイズ・いつわ劇場）。2026/11/09〜。数字・通数・収益はカードで返す。収益は TikTok Studio の記録（moshimo-analytics の data/tiktok-studio.jsonl）を、まとめ（summary.yml）が1日3回もしもラボの投稿サーバーへ送っている。サーバーの中身を入れ替えるときは server/update-servers.sh <コミット>（VPS で root）。
- TikTok の下書き（投稿サーバーから TikTok アプリの受信箱に送る仕組み）は 2026/11/09 にやめた（/etc/quiz.env・/etc/itsuwa.env の TT_UPLOAD=0。今すぐ投稿・時間指定でも送らない）。クイズ・いつわ劇場の TikTok は、ゆうとの Mac の Chrome のアカウントごとのプロフィールで予約する（moshimo-analytics の TIKTOK.md の 5・notes/tiktok-browsers.md）。動画は quiz-cdn.yml で Cloudinary に置いて、TikTok Studio のページで取り込む。
- いつわ劇場の TikTok は 2026/11/03 に数字を読む許可（user.info.stats・video.list）を Sandbox itsuwa に足した。ゆうとが いつわ劇場の LINE で TikTok つなぎ直し と送って許可し直すと、数字が投稿サーバーで取れるようになる。
- まとめの TikTok の数字は、投稿サーバーで取れていないアカウント（クイズ・いつわ劇場）は公開ページから読む（moshimo-analytics の data/<アカウント>/tiktok-embed/ に貯まる）。いま回ってる動画 は直近およそ3時間（公開ページの分は前回のまとめから）で再生が大きく増えた動画。

## 声（Gemini TTS）の1日の上限
- 1つのキー（Google Cloud プロジェクト）につき、gemini-3.8-flash-tts が1日100回、予備の gemini-3.8-flash-lite-tts も1日100回（Tier 1）。1行の字幕につき1回使う（もしもラボ1本で約15回、クイズ1本で約17回。同じ文は前に作った声を使い回すので数えない）。
- キーはアカウントごとに分ける：もしもラボ GEMINI_API_KEY（1日4本で約60回）、クイズ GEMINI_API_KEY_QUIZ（1日5本で約85回。未登録のあいだは GEMINI_API_KEY を使う）、いつわ劇場 GEMINI_API_KEY_DRAMA（1話で約30〜45行、撮り直しを入れて40〜60回なので1日1話まで）。
- 上限に当たると声なしでは作らずに書き出しが止まる。上限が戻るのは毎日17:00（日本時間。米国の夏時間のあいだは16:00）。

## 声（Gemini TTS）の1日の上限
- 1つのキー（Google Cloud プロジェクト）につき、gemini-3.8-flash-tts が1日100回、予備の gemini-3.8-flash-lite-tts も1日100回（Tier 1）。1行の字幕につき1回使う（もしもラボ1本で約15回、クイズ1本で約17回。同じ文は前に作った声を使い回すので数えない）。
- キーはアカウントごとに分ける：もしもラボ GEMINI_API_KEY（1日4本で約60回）、クイズ GEMINI_API_KEY_QUIZ（1日5本で約85回。未登録のあいだは GEMINI_API_KEY を使う）、いつわ劇場 GEMINI_API_KEY_DRAMA（1話で約30〜45行、撮り直しを入れて40〜60回なので1日1話まで）。
- 上限に当たると声なしでは作らずに書き出しが止まる。上限が戻るのは毎日17:00（日本時間。米国の夏時間のあいだは16:00）。render-chain.yml の 17:20 の回が、朝に上限で止まった続きを書き出す。


## 収益化の条件（月曜に ops/report.md が確認。2026年11月時点。変わっていそうなら公式で確かめる）
- TikTok（Creator Rewards Program）：18歳以上・フォロワー1万人以上・直近30日の再生10万回以上・1分を超える動画。もしもラボは 2026/10/22 から収益化済み（moshimo-analytics の notes/tiktok-crp.md）。
- YouTube（パートナープログラム）：登録者1,000人以上かつ直近90日のショートの再生1,000万回以上で広告収益。登録者500人以上・直近90日に3本以上の公開・ショートの再生300万回以上でメンバーシップなどのファン収益。
- インスタ：日本ではリールの再生への報酬はない。フォロワーが増えてきたら、ブランドとのタイアップ（ブランドコンテンツ）を日報の お願い で提案する。

