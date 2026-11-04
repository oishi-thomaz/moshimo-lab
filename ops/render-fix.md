# render-fix：書き出しの失敗を直す（today.mjs に ■ render-fix が出たときだけ）

書き出しは render-chain.yml（5:20・17:20）が動かし、落ちた回は同じ番号で1回だけ自動でやり直している。ここに出るのは、それでも上がらなかった回（tools/watch-check.mjs の 要対応）。声の1日の上限で落ちた回は 上限待ち として 報告だけ に出る（17:20 の回が続きをやるので、ここではやらない）。

1. ログでエラーを特定する（ops/rules.md の gh api の見方）。
2. 直す：
   - 書き出し側のコード（tools/、engine/）のバグなら直す。台本（engine/videos/NNNN.js・qNNN.js）が原因なら、中身（数字・出典・構成・答え）は変えずに書き方だけ直す。ナレーションのはみ出しは字幕の時間を広げるか言い回しを短くする。チラつき（Zファイティング）で止まったときは、重なっている面をずらす（tools/flicker.sh NNNN で確かめる）。
   - 直したら手元で `bash tools/smoke.sh NNNN`（もしもラボ。影響がありそうなら引数なしで在庫の次の10本も）を通してから commit・push。クイズは `bash tools/build.sh qNNN` が通ることを確かめる。
   - 一時的な失敗（ネットワーク・ブラウザ・声のAPIの1分あたりの上限）は直さずにやり直すだけ。
3. やり直す：`gh api -X POST repos/oishi-thomaz/moshimo-lab/actions/workflows/render-chain.yml/dispatches -f ref=main` を1回（今日の残りの本数だけ、同じ番号から書き出す。二重にはならない）。終わるのは待たない。
4. 2日続けて同じ番号が上がらないときは、その番号を plan/queue.txt（クイズは plan/quiz-queue.txt）の後ろに回して commit・push する（番号は消さない）。次の回から上がる。
5. 直したことは日報の やったこと に1行で入る（report のサブエージェントに渡すか、最後の返答に書く）。別に SNS司令室には送らない。
