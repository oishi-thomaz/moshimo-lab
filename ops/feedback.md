# feedback：修正の指示を取り込む（today.mjs に ■ feedback が出たとき。何よりも先に）
1. 対象は today.mjs の ■ feedback の行（data/state.json・data/quiz/state.json・data/itsuwa/state.json の items で feedback があって feedbackDone がない回。その回は投稿サーバーで却下になっている）。指示の全文は その items の feedback。クイズの番号は 5000＋回（5004 → q004）。
   - 先に git log で、その番号の 修正の指示 の commit がもう入っていないか見る（前の回が途中で止まったとき）。入っていれば 4. だけやる。
2. ゆうとの指示どおりに台本を直す（指示があれば数字・構成・言い回しも変えてよい。事実は一次資料で確かめる）。もしもラボ・クイズは、直した台本を commit したあと state/rendered.txt（クイズは state/quiz-rendered.txt）からその番号を消し、在庫（plan/queue.txt・plan/quiz-queue.txt）の一番前に置いて push する。次の書き出しで同じ番号で上がり、また承認待ちに出る。いつわ劇場は docs/ITSUWA-AUTO.md の 4 で作り直して send.sh で送り直す。
3. 同じ種類の指摘がまた起きないよう、ルールに足す（もしもラボは plan/RULES.md か docs/PRODUCTION.md、クイズは docs/QUIZ.md、いつわ劇場は docs/ITSUWA-AUTO.md の 3）。
4. reports/outbox/control-<アカウント>-fb-YYYY-MM-DD.json に {"feedbackDone": ["番号", ...]} を書いて `node tools/run.mjs control <ファイル> --account=<アカウント>`（同じ指示を二重に直さないため）。
5. 最後の返答に、何をどう直したかを1行ずつ書く（日報の やったこと に入る）。

作り直しの作り方は、もしもラボ docs/PRODUCTION.md・plan/RULES.md、クイズ docs/QUIZ.md、いつわ劇場 docs/ITSUWA-AUTO.md（直すところに関係する節だけ読めばよい）。直した回は、次の朝 5:20 の render-chain が同じ番号で書き出して、また承認待ちに出る（その日のうちに出したいときは daily-render.yml を番号なしで1回 dispatch。直した回が在庫の先頭なのでその番号が出る。クイズは quiz-render.yml に inputs[id]=qNNN）。

