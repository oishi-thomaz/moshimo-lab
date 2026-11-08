# SNS 運用の入口（毎日の定期タスクが毎回読むのはこの1枚だけ）

旧の定期タスク（朝の仕事・見張り・動画制作・TikTok予約）からこのファイルを開いたときは、ops/legacy.md を読んでそれに従う（2026/11/05 に1本へ切り替え中。旧タスクを全部止めたら legacy.md は消す）。

ゆうと（トーマス合同会社の代表）の3アカウント（もしもラボ・タイトル当てクイズ・いつわ劇場）は、1日1回の定期タスク SNS 毎日の運用（9:23・Sonnet）で回す。Claude でなくてもできることは Claude を使わずに動いている：

| いつ（日本時間） | 何が | やること |
|---|---|---|
| 5:20・17:20 | moshimo-lab の render-chain.yml | 書き出し（もしもラボ・クイズ）。本数は ops/render.json。落ちた回は同じ番号で1回だけ自動でやり直す。17:20 は声の1日の上限（17:00 に戻る）で止まった続き |
| 8:00・13:00・22:30 | moshimo-analytics の summary.yml | SNS司令室のまとめ。数字はまとめ側が出す。Claude の日報は 13:00 の昼のまとめに載る |
| 8:00 ごろ | ゆうと | SNS司令室で 動画の承認・修正の指示・台本の返事（1日1回） |
| 8:45 | moshimo-analytics の daily-prep.yml | 3アカウントの collect と集計（analysis/）を commit |
| いつも | 投稿サーバー（VPS） | 投稿・承認カード・バズの通知（TikTok の下書きに送る仕組みは 2026/11/09 にやめた。TikTok は3アカウントとも Chrome で予約する） |

リポジトリ：oishi-thomaz/moshimo-lab（公開。動画・台本・手順書）と oishi-thomaz/moshimo-analytics（非公開。数字・日報・TikTok の記録）。アカウントや仕組みの細かいこと（アカウント一覧・LINE・声の上限・収益化の条件）は ops/reference.md。要るときだけ読む。

## 毎回の流れ
1. 用意：両方のリポジトリを add_repo して /home/claude/moshimo-lab と /home/claude/moshimo-analytics に clone（あれば git pull --rebase）。
2. 決めごと：ops/rules.md を読む。
3. 判定：`cd /home/claude/moshimo-analytics && node tools/today.mjs`。今日やることが ■ モジュール ごとに出る（データが古ければ自分で collect する）。出たモジュールの手順書だけを使う。出ていないモジュールは読まない・やらない。最後の行が やること 0 件 なら、そこで 今日はやることなし と返して終わる。
4. ■ render（自分で。手順書なし）
   - 書き出しの予定を書き換えた：moshimo-lab で ops/render.json だけを commit・push。
   - 書き出しが今日まだ動いていない：`gh api -X POST repos/oishi-thomaz/moshimo-lab/actions/workflows/render-chain.yml/dispatches -f ref=main` を1回だけ。終わるのは待たない。
5. ■ render-fix（書き出しの失敗）：ops/render-fix.md を読んで自分で直す。
6. ほかのモジュールはサブエージェントに任せる（Agent ツール、general-purpose、run_in_background）。自分では手順書を読まない。依頼文は下の形をそのまま使う：
   `<モジュール>：today.mjs の出力は次のとおり。<そのモジュールの行をそのまま貼る>。/home/claude/moshimo-lab/<手順書> を最後まで読んで、そのとおりにやって。作業フォルダは cp -r /home/claude/moshimo-lab /home/claude/w-<モジュール>-lab と cp -r /home/claude/moshimo-analytics /home/claude/w-<モジュール>-an で作ってそこで作業し、終わる前に全部 push してから消す（push の前に git pull --rebase）。/home/claude/moshimo-lab/ops/rules.md を読んで守る。最後に、やったこと（番号・タイトル）と、できなかったこととその理由を短く返す。`
   - モデル：feedback・make-moshimo・make-quiz・make-itsuwa・report は model に opus。tiktok は sonnet（ゆうとの Mac の Chrome を使う。アカウントごとに別のプロフィールで、Claude からは別のブラウザに見える。手順書は /home/claude/moshimo-analytics/TIKTOK.md。もしもラボ・クイズ・いつわ劇場の行をまとめて1つのサブエージェントに渡す。ブラウザの選び直しがぶつかるので、tiktok は2つ立てない）。
   - 順番：feedback・report・tiktok・make-moshimo を先に立て、make-quiz・make-itsuwa は空いたら立てる（同時に動かすのは4つまで。日報は 12:58 までに push すれば昼のまとめに載る）。
7. 全部のサブエージェントが返ってきたら、両方のリポジトリで git pull --rebase してから `node tools/today.mjs` をもう一度だけ動かして、残りがあれば最後の返答に書く（やり直しはしない。次の回が拾う）。作業フォルダ（/home/claude/w-*）が残っていれば push 済みか確かめて消す。
8. 最後の返答：関西弁のタメ口で短く。アカウントごとに1〜2行（作った番号・TikTok に予約した回・直したこと・日報の要点）と、ゆうとにやってほしいことがあればそれだけ。

## 落ちても取り戻せる作り
- today.mjs の判定は全部、リポジトリと投稿サーバーの今の状態から出す（済んだことは出ない）。使用量の上限などで途中で止まっても、次の回に残りがそのまま出る。なので、どのモジュールも1本・1区切りごとに commit・push する。
- 書き出しは Claude が止まっても Actions が毎日動く。TikTok の予約は承認済みの回を何日分も先まで入れておくので、1日抜けても穴はあかない。

## 共通の決めごと
ops/rules.md（短い）。親もサブエージェントも毎回読んで守る。
