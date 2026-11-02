# SNS アカウントの運用（定期タスクの手順書）

ゆうと（トーマス合同会社の代表）の SNS アカウントは、アカウントの数に関係なく、次の4本の定期タスク（Claude）と、Claude を使わないまとめ1本で回す。アカウントが増えたら、下の アカウント一覧 に1行足して、そのアカウントの手順書を用意するだけにする（タスクは増やさない）。

| タスク | いつ | やること |
|---|---|---|
| 朝の仕事 | 毎日 6:15 | 全アカウントの解析と日報（8:00 の SNS司令室のまとめに入る）→ 今日の分の書き出し（承認カードが各アカウントの LINE に届く） |
| 見張り | 毎日 8:37・11:37・15:37・17:37 | 書き出し・送信の失敗を直して上げきる。15時台の回は午後の見回りも。何もなければ手順書を読まずにすぐ終わる |
| 動画制作 | 毎日 10:47・16:47 | 在庫が減ったアカウントの動画を作る（アカウントごとにサブエージェントで並行） |
| TikTok 予約 | 毎日 8:07・10:07・11:07・14:07・17:07・20:07・23:07（ゆうとの Mac） | LINE で承認された回を、インスタと同じ時間で TikTok に予約する（何もなければすぐ終わる） |
| まとめ（Claude なし） | 毎日 8:00・13:00・22:30 | moshimo-analytics の summary.yml（GitHub Actions）が3アカウントのまとめを SNS司令室 に送る。朝は日報も入る |

回数を減らしたのは 2026/11/02 のゆうとの決定（トークンのムダをなくすため）。見張りと TikTok 予約は Sonnet、朝の仕事と動画制作は Opus で動く。

リポジトリ：oishi-thomaz/moshimo-lab（公開。動画・台本・この手順書）と oishi-thomaz/moshimo-analytics（非公開。数字・日報・TikTok の記録）。/home/claude/moshimo-lab と /home/claude/moshimo-analytics に clone して使う（すでにあれば git pull --rebase）。

## アカウント一覧

| アカウント | 中身 | 投稿 | 在庫の数え方 | 作り方 | 書き出し | 解析・日報 | TikTok |
|---|---|---|---|---|---|---|---|
| もしもラボ（moshimo、@moshimo__lab） | もしも○○したら？の3D解説（約60秒） | 1日3本 12:00・18:00・20:30（インスタ・YouTube 自動） | plan/queue.txt にあって state/rendered.txt にない本数 | docs/PRODUCTION.md・plan/STRATEGY.md・plan/RULES.md | daily-render.yml を3回（1本ずつ順番に） | moshimo-analytics の ANALYST.md | moshimo-analytics の TIKTOK.md（Chrome・Claude in Chrome） |
| タイトル当てクイズ（quiz、@title_ate_quiz） | 映画・ドラマのタイトル当て3D（約64秒） | 1日5本 12:00・15:00・18:00・20:00・22:00（立ち上げの1か月） | plan/quiz-queue.txt にあって state/quiz-rendered.txt にない本数 | docs/QUIZ.md | quiz-render.yml を1回（count=5） | この下の 日報（サーバー型） | docs/QUIZ-TIKTOK.md（Claude アプリのブラウザ） |
| いつわ劇場（itsuwa、@itsuwa_drama） | 1話3分・全5話のショートドラマ | 1日1話 20:00 | docs/ITSUWA-AUTO.md の 1 | docs/ITSUWA-AUTO.md | なし（作った話をその場で送る） | この下の 日報（サーバー型） | なし（投稿サーバーが TikTok の下書きに送る） |

各アカウントの投稿サーバー（VPS）は別々で、承認用の LINE 公式アカウントもアカウントごとに別。承認はゆうとが LINE でする。

## 連絡は SNS司令室 にまとめる（2026/11/02〜）
- 日報・見張りの直した連絡・午後の見回りの連絡は、全部 SNS司令室（まとめ用の LINE 公式アカウント。Secrets の SNS_LINE_TOKEN）に送る。Claude から各アカウントの LINE には何も送らない（ゆうとの決定。各アカウントの LINE に届くのは承認カードと、投稿サーバー自身の通知だけ）。
- 送り方は moshimo-analytics の `node tools/run.mjs report <ファイル>`（または `notice`）。朝の日報（reports/outbox/YYYY-MM-DD.json・quiz-…・itsuwa-…）は 7:58 までに push してあれば送らずに終わり、8:00 のまとめに入る。それより後の日報と、-pm・-fix などの連絡はその場で SNS司令室に届く。JSON の形は ANALYST.md の 日報の書き方 と同じ（{card} か {message}）。
- もしもラボの notice.yml・投稿サーバーの report は使わない（各アカウントの LINE に行くため）。
- SNS司令室に ストック と送ると、まだ投稿していない動画（予約済み・承認待ち・書き出し前の在庫）が3アカウント分カードで返ってくる。返事係は VPS の server/sns-server.mjs（install-sns.sh で入れる。/var/lib/moshimo・quiz・itsuwa の state.json と、このリポジトリの在庫を読むだけ）。
- 4つの LINE（SNS司令室・各アカウント）には下にボタンのメニューがある（server/setup-richmenu.mjs で入れる。画像は server/richmenu/）。SNS司令室：ストック・承認待ち・今日の投稿・いま回ってる・いまの数字・使い方。各アカウント：承認待ち・投稿した・数字・通数。
- まとめの TikTok の数字は、投稿サーバーで取れていないアカウント（クイズ・いつわ劇場）は公開ページから読む（moshimo-analytics の data/<アカウント>/tiktok-embed/ に貯まる）。いま回ってる動画 は直近およそ3時間（公開ページの分は前回のまとめから）で再生が大きく増えた動画。

## 声（Gemini TTS）の1日の上限
- 1つのキー（Google Cloud プロジェクト）につき、gemini-3.8-flash-tts が1日100回、予備の gemini-3.8-flash-lite-tts も1日100回（Tier 1）。1行の字幕につき1回使う（もしもラボ1本で約15回、クイズ1本で約17回。同じ文は前に作った声を使い回すので数えない）。
- キーはアカウントごとに分ける：もしもラボ GEMINI_API_KEY（1日3本で約45回）、クイズ GEMINI_API_KEY_QUIZ（1日5本で約85回。未登録のあいだは GEMINI_API_KEY を使う）、いつわ劇場 GEMINI_API_KEY_DRAMA（1話で約30〜45行、撮り直しを入れて40〜60回なので1日1話まで）。
- 上限に当たると声なしでは作らずに書き出しが止まる。上限が戻るのは毎日17:00（日本時間。米国の夏時間のあいだは16:00）。

## 共通の決めごと
- 投稿・承認そのもの（インスタ・YouTube・TikTok の公開、LINE の承認）はしない。承認カードを出すところまで。TikTok は予約まで。
- VPS・GitHub の Secrets・Actions の設定は変えない。ほかの定期タスクも変えない。
- アカウントどうしのファイルを混ぜない（もしもラボは engine/videos/ の4桁・plan/queue.txt・state/rendered.txt、クイズは q 始まり・plan/quiz-queue.txt・state/quiz-rendered.txt、いつわ劇場は drama/）。
- GitHub のワークフローは `gh api -X POST repos/<repo>/actions/workflows/<file>/dispatches -f ref=main -f 'inputs[...]=...'` で動かす（gh workflow run はこの環境では使えない）。状態は `gh api "repos/<repo>/actions/workflows/<file>/runs?per_page=3"`、ログは `gh api repos/<repo>/actions/runs/<run id>/jobs` の job id で `gh api repos/<repo>/actions/jobs/<job id>/logs`。
- commit の最後に `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。push の前に git pull --rebase（書き出しの bot が state/ を更新するため）。
- ゆうとへの最後の返答は関西弁のタメ口で短く。敬語・丁寧語は使わない。「」と ** は使わない。語尾に 〜ね は使わない。ゆうとの発言やゆうとがやったことを創作しない。数字は記録に出ているものだけ。

## 1. 朝の仕事（6:15）
1. 両方のリポジトリを用意する。
2. 解析と日報（アカウント一覧の順に）：
   - もしもラボ：moshimo-analytics の ANALYST.md の 毎朝の手順（月曜は 毎週月曜の朝にやること も）。
   - クイズ・いつわ劇場：下の 日報（サーバー型）。
   - 月曜はマネタイズの確認も：下の 収益化の条件 を見て、届きそうなものや申請できるものがあれば、そのアカウントの日報の お願い に1行で書く。
   - 日報の カード は SNS司令室の朝のまとめに、分かったこと・やったこと・お願い（と キャプション の section）が載る（数字はまとめ側が自分で出すので、カードの数字の section は載らない）。なので 分かったこと・やったこと・お願い を必ず items で書く。
3. 書き出し：解析で在庫の順番を変えたものを push してから、アカウント一覧の 書き出し を全部動かす。
   - もしもラボ：daily-render.yml を番号なしで3回。同時に1本しか待機できない（2本目を予約すると前の待機分が取り消される）ので、1本目が in_progress になってから次を予約する。1本20分くらい。
   - クイズ：quiz-render.yml を1回だけ（inputs[count]=5）。1本10〜12分で、1本できるごとに LINE に承認カードが届く。
   - 両方とも終わるまで待つ。落ちた回は 2. 見張り の直し方で直して、同じ番号で1回だけやり直す（同じ回を二重に上げない。もしもラボは state/rendered.txt、クイズは state/quiz-rendered.txt を確かめてから）。在庫が空なら その旨だけ。
4. 最後の返答：アカウントごとに 日報の要点1行と、書き出した番号と結果。

### 日報（サーバー型：クイズ・いつわ劇場）
1. moshimo-analytics で `node tools/run.mjs collect --account=<quiz|itsuwa>` → `node tools/brief.mjs <quiz|itsuwa>` を実行し、出てきた analysis/<アカウント>-YYYY-MM-DD.md を全部読む。notes/<アカウント>-insights.md と直近3日の reports/<アカウント>-YYYY-MM-DD.md も読む（なければ作る）。
2. 見る順番：平均視聴秒（動画の長さに対して）→ 保存・シェア → コメント（何秒でわかった？に答えてくれているか）→ 再生の伸び → フォロワーの増え方。1本の結果で決めつけない。
3. 打てる手：
   - クイズ：plan/quiz-queue.txt の、まだ書き出していない回の並びを変えてよい（番号は消さない）。伸びたジャンル・国・映画かドラマか、を notes/quiz-insights.md に書く（動画制作がそれを読んで次の作品を選ぶ）。
   - いつわ劇場：伸びた話・離脱の多い話と、その理由の仮説を notes/itsuwa-insights.md に書く（動画制作が次の作品の作りに使う）。
4. 日報を書く：reports/<アカウント>-YYYY-MM-DD.md に全文、reports/outbox/<アカウント>-YYYY-MM-DD.json に LINE 用のカード（形は ANALYST.md の 日報の書き方 と同じ。title は タイトル当てクイズ 日報 11/2 のように。at は書かなくてよい）。commit・push してから `node tools/run.mjs report reports/outbox/<アカウント>-YYYY-MM-DD.json`（7:58 までなら送らずに終わり、8:00 の SNS司令室のまとめに入る。過ぎていればその場で SNS司令室に届く）。
5. まだ数字がほとんどない日（投稿が少ない・インサイトが0）は、取れてない と正直に書いて短くする。QUIZ_AN・ITSUWA_AN が未設定で collect が落ちるときは、そのアカウントの日報は飛ばし、最後の返答に1行で書く。

### 収益化の条件（月曜に確認。2026年11月時点。変わっていそうなら公式で確かめる）
- TikTok（Creator Rewards Program）：18歳以上・フォロワー1万人以上・直近30日の再生10万回以上・1分を超える動画。もしもラボは 2026/10/22 から収益化済み（moshimo-analytics の notes/tiktok-crp.md）。
- YouTube（パートナープログラム）：登録者1,000人以上かつ直近90日のショートの再生1,000万回以上で広告収益。登録者500人以上・直近90日に3本以上の公開・ショートの再生300万回以上でメンバーシップなどのファン収益。
- インスタ：日本ではリールの再生への報酬はない。フォロワーが増えてきたら、ブランドとのタイアップ（ブランドコンテンツ）を日報の お願い で提案する。

## 2. 見張り（8:37・11:37・15:37・17:37）
書き出しが動くのは朝の仕事の中だけ（いつわ劇場の送信は動画制作の中）なので、見張りは1日4回。17:37 は声の1日の上限が戻った（17:00）あとのやり直し用。
0. まず moshimo-lab だけを用意して `node tools/watch-check.mjs` を実行する（今日6:00以降の実行から、未解決・報告だけ・実行中を出す）。最後の行が 異常なし で、15時台の回でもなければ、この先は読まずに 異常なし とだけ返して終わる。実行中 だけなら5分待ってもう一度（最大3回。まだ実行中なら 実行中なので次の回で見る と返して終わる）。要対応・報告だけ があるか、15時台の回なら、moshimo-analytics も用意して下へ進む。
1. 両方のリポジトリを用意する。
2. watch-check の結果と、今日6:00以降の moshimo-lab のワークフロー実行（`gh api "repos/oishi-thomaz/moshimo-lab/actions/runs?per_page=50"`）で、daily-render・preflight・quiz-render・quiz-cdn・drama-tts・drama-publish を見る。
   - daily-render は同じ動画番号（ログの video: NNNN）で failure のあとに success がないもの、quiz-render はログで書き出しに失敗した回（クイズ qNNN の書き出しに失敗）が state/quiz-rendered.txt にないもの、preflight は最新が failure なら、未解決。cancelled は同じ番号のあとの実行がないときだけ未解決。実行中のものは待つ。
   - drama-tts・drama-publish・quiz-cdn の失敗は、直さずに最後の返答に1行で書く（動画制作・TikTok 予約が次の回にやり直す）。
3. 未解決があれば、ログでエラーを特定して直す：
   - 書き出し側のコード（tools/、engine/）のバグなら直す。台本（engine/videos/NNNN.js・qNNN.js）が原因なら、中身（数字・出典・構成・答え）は変えずに書き方だけ直す。ナレーションのはみ出しは字幕の時間を広げるか言い回しを短くする。
   - 直したら手元で `bash tools/smoke.sh NNNN`（もしもラボ。影響がありそうなら引数なしで在庫の次の10本も）を通してから commit・push。クイズは `bash tools/build.sh qNNN` が通ることを確かめる。
   - 一時的な失敗（ネットワーク・ブラウザ・声のAPIの1分あたりの上限）は直さずにやり直す。
   - ログに ナレーションの1日の上限に達した が出ているときは、声の1日の上限（Gemini の TTS は1モデル1日100回・キーを作った Google Cloud プロジェクトごと）。上限が戻るのは毎日17:00（日本時間。米国の夏時間のあいだは16:00）なので、それまではやり直さない（何度やっても落ちる）。戻った後の見張りの回でやり直す。投稿枠に間に合わない回があれば、SNS司令室に1行で知らせる（下の 5 と同じ送り方）。声なしの動画は作らない。
4. 同じ番号でやり直す：もしもラボは daily-render.yml に inputs[id]=NNNN、クイズは quiz-render.yml に inputs[id]=qNNN。終わるまで待って success を確かめる。最大3回。3回直しても上がらないときは、枠に穴があかないよう在庫の次の回（もしもラボは node tools/next.mjs、クイズは node tools/quiz-next.mjs 1）を代わりに上げる。落ちた回は在庫に残す。
5. 直したときだけ、SNS司令室に1件だけ知らせる：moshimo-analytics で reports/outbox/<アカウント>-YYYY-MM-DD-fix.json（もしもラボは YYYY-MM-DD-fix.json）に {"account": "moshimo|quiz|itsuwa", "card": {"title": "見張り（アカウント名）", "sections": [{"head": "直した", "items": ["…"]}]}} を書いて commit・push し、`node tools/run.mjs notice <ファイル>`。何が・なぜ落ちて・どう直して・今は承認待ちに入ったか。
6. 15時台の回だけ：もしもラボは ANALYST.md の 午後の回 もやる。
7. 何もなければ 異常なし とだけ返して終わる（どこにも送らない）。

## 3. 動画制作（10:47・16:47）
1. 両方のリポジトリを用意する。
2. アカウントごとに在庫を数えて、作るかどうかを決める：
   - もしもラボ：在庫が21本を下回っていたら28本になるまで作る（1回で最低7本）。21本以上なら作らない。
   - クイズ：在庫が20本を下回っていたら20本になるまで作る（1回で最大6本。品質を落として数を合わせない）。
   - いつわ劇場：docs/ITSUWA-AUTO.md の 1。作るのは1日1話まで（今日すでに1話送っていれば作らない）。
3. 作るアカウントごとに、サブエージェント（Agent ツール、general-purpose）を1つずつ同時に立てて任せる。同じフォルダで同時に git を使うとぶつかるので、先に `cp -r /home/claude/moshimo-lab /home/claude/work-<アカウント>` でアカウントごとの作業フォルダを作り、そこで作業させる（push の前に git pull --rebase）。サブエージェントへの依頼には、作業フォルダ、作る本数、そのアカウントの作り方（下）、共通の決めごと、最後に作った番号・作品名・在庫を返すこと、を書く。
   - もしもラボ：moshimo-analytics の notes/insights.md・最新の analysis/YYYY-MM-DD.md の 傾向・data/tiktok-studio.jsonl を読んで、伸びている型・避ける型を反映する。plan/STRATEGY.md（最優先。特に 0. 2026/11/02〜の方針 と 8. TikTok基準の作り）→ docs/PRODUCTION.md（最後まで。2. 構成 の v2 の形）→ plan/RULES.md の順に読んで完全に従う。何を作るかは PRODUCTION.md の決め方（blueprint の priority → 1日3本＝社会の消えたら2本＋人体の限界1本、挑戦は週3本まで（挑戦の回は META に trial: true）→ 柱は series ごとに no 順）。新しい回は全部 META に v2: true と hookLine と series。0秒目＝サムネ・0.6秒以内に異変・いつもの日常なし・10〜12秒ごとに次を見たくなる一言・61〜65秒。在庫に v2 になっていない回が残っていたら v2 に作り直す（見本は engine/videos/0102.js）。queue には 社会の消えたら・人体の限界・社会の消えたら の並びで差し込む。数字は必ず WebSearch・WebFetch で一次資料まで確かめ、確かめられない数字は使わない。1本ごとに静止画（0・0.4・1・2・3秒を含む15枚）を書き出して全部目で見て、0秒目がサムネとして成り立つか・0.6秒までに異変があるか・隠れ・文字のかぶり・はみ出し・暗すぎ・エラーがないかを確かめてから commit。新しい再利用シーンは PRODUCTION.md のシーン一覧に足す。避けるもの：実在の国が消える話・戦争・実在の人物（政治家・有名人・ネットミームの元の人も）・実在ブランドの見た目・生々しいグロ・食事や水を極端に削るお題。
   - クイズ：docs/QUIZ.md を最後まで読んで完全に従う。見本は engine/videos/q001.js〜q003.js と quiz-kit.js。moshimo-analytics の notes/quiz-insights.md があれば作品選びに反映する。作品はこれまでの回（engine/videos/q*.js の META.answer）と重ならないこと、日本の Netflix・U-NEXT・Prime Video・DMM TV・Hulu・FOD・Disney+ のどれかで今見放題か（JustWatch 日本版かサービスの作品ページを実際に開く）、誰でも知ってる作品か（Filmarks のレビュー数が映画5万件以上・ドラマとアニメはシーズン1で3万件以上。曲はストリーミング認定プラチナ以上）、Filmarks の点数が目安3.8以上か（作品ページを実際に開く）を確かめる。サービスは偏らせない。動画とキャプションで登録やリンクを勧める宣伝はしない（サービス名は答えのカードとハッシュタグだけ）。オールジャンル・国やジャンルが続かない・映画とドラマ半々。あらすじの事実は公式か信頼できる紹介ページで確かめたものだけ、結末・犯人・どんでん返しの中身は書かない。作品の映像・ポスター・俳優の顔・ロゴ・有名なシーンの構図は使わない。歌詞は使わない。1本ごとに静止画15枚以上を全部目で見て120点にしてから plan/quiz-queue.txt の末尾に足して commit。
   - いつわ劇場：docs/ITSUWA-AUTO.md の 2〜5。moshimo-analytics の notes/itsuwa-insights.md があれば反映する。
4. 全部のサブエージェントが終わったら、作業フォルダが全部 push 済みか確かめて、作業フォルダを消す。
5. 最後の返答：アカウントごとに、作った番号・タイトル（クイズは作品名・映画かドラマか・Filmarks の点数、もしもラボはシリーズの区分と hookLine）と在庫。作らなかったアカウントは 在庫は足りてる。

## 4. TikTok 予約（8:07・10:07・11:07・14:07・17:07・20:07・23:07、ゆうとの Mac）
TikTok はインスタと同じ時間に出す（2026/11/1 ゆうとの決定）。承認された回を、そのインスタの投稿時間で予約する。承認が遅れてインスタの時間を過ぎた回は、次の回で 今 で出す（遅れは最大3時間）。予約する回がなければブラウザを開かずに すぐ終わる。23:07 の回は TIKTOK.md の 3.5・3.6（プレイリスト・ピン留め・TikTok Studio の数字の記録）もやる。
0. まず moshimo-analytics だけを用意して `node tools/run.mjs collect && node tools/tiktok-todo.mjs`。最後の行が 候補なし で23時台でなければ、Chrome も手順書も開かずに 予約する回なし と返して終わる。
1. 両方のリポジトリを用意する。
2. もしもラボ：moshimo-analytics の TIKTOK.md を最後まで読んで完全に従う（notes/tiktok-schedule.md・notes/tiktok-crp.md も）。Chrome（Claude in Chrome）を使う。Chrome の操作の前に chrome-browser のスキルを読む。
3. クイズ：（2026/11/2 から停止中。docs/QUIZ-TIKTOK.md の先頭を見る）docs/QUIZ-TIKTOK.md を最後まで読んで完全に従う（state/quiz-tiktok.md も）。Claude アプリのブラウザ（built-in browser、mcp__remote-devices__Claude_Browser__*）を使う。操作の前に built-in-browser のスキルを読む。Chrome は絶対に使わない（Chrome は @moshimo__lab でログインしているので、取り違えるとクイズの動画がもしもラボに出てしまう）。
4. いつわ劇場：やることはない（投稿サーバーが TikTok の下書きに送っている）。
5. 片方につながらないときは、そちらは つながらなかった とだけ書いて、もう片方は続ける。
6. TikTok のアカウント設定は変えない（ビジネスアカウントへの切り替えは絶対にしない）。ログインやパスワードの入力はしない。公開済みの投稿は消さない・変えない。
7. 最後の返答：アカウントごとに、予約した回（番号・タイトル・日時）と、できなかったことの理由。もしもラボは TIKTOK.md の報告の内容（収益化の審査待ちで止めた回、手動投稿をお願いしたい回とそのキャプション）も。
