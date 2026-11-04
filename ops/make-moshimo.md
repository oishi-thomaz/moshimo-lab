# make-moshimo：もしもラボの台本と動画（today.mjs に ■ make-moshimo が出たとき。Opus のサブエージェント）

today.mjs の行が、今日やることを決めている（台本の返事を動画にする／動画にした台本の done を送る／台本の候補を12本出す）。出ていないことはやらない。
2026/11/03〜 台本は承認制（ゆうとの決定）。承認されていない台本は動画にしない。

## 1. 台本
a. 返事を取り込む：moshimo-analytics の data/state.json の scripts を見る（today.mjs の 台本の返事を動画にする の行がその番号）。status が ok（この台本でOK）と fix（直してOK。feedback の指示どおりに直す）で done がないものを、今回ぜんぶ動画にする（下の 2.）。plan/scripts.md の状態を 承認済み（fix は 承認済み（修正あり）と指示を書き写す）にし、動画にしたら 制作済み NNNN にする。skip は 見送り にする。動画にした台本は reports/outbox/scripts-done-YYYY-MM-DD.json に {"done": ["S11", ...]} を書いて `node tools/run.mjs scripts <ファイル>`。
b. 台本の候補を出す（today.mjs に 台本の候補を12本出す が出たとき。在庫＝投稿サーバーの承認待ちと承認済み＋書き出し前の回＋承認済みでまだ動画にしてない台本 が20本（5日分）を下回っていて、返事待ちがない）：台本の候補を12本書く。ゆうとの作業は毎朝8:00の1回だけなので、台本の候補（この日 9:23〜）→ 返事（翌朝8:00）→ 動画にする（翌日 9:23〜）→ 書き出し（翌々日 5:20）→ 動画の承認（同8:00）→ 投稿（次の空き枠）と3日ほどかかる。切れる前に出す。plan/STRATEGY.md の 00（皮肉回が主軸。当たっている柱で自信があるものも入れてよい、自信がないものは入れない）と docs/PRODUCTION.md の 2. 構成 に従う。plan/reserve.txt の回も、作り直して自信があるものは候補にしてよい。番号は plan/scripts.md のいまの最後の番号の続き。1本ごとに 14行前後の台本・質問・根拠（なぜ当たるか、どの数字に近いか）を書き、数字は一次資料で確かめたものだけ。
c. plan/scripts.md に 返事待ち で足して commit・push し、moshimo-analytics の reports/outbox/scripts-YYYY-MM-DD.json に {"add": [{"id": "S11", "title": "もしも〇〇が消えたら？", "pillar": "社会の消えたら", "lines": ["1行目", ...], "ask": "質問", "note": "根拠を1行"}, ...]} を書いて commit・push、`node tools/run.mjs scripts <ファイル>` で SNS司令室の 承認待ち に出す。続けて reports/outbox/scripts-YYYY-MM-DD-notice.json に {"message": "もしもラボの台本の候補を12本、承認待ちに入れた。この台本でOK・直してOK・見送り を押して。"} を書いて `node tools/run.mjs notice <ファイル>`（1通）。
d. 返事が来るまで、承認されていない台本は動画にしない。
動画にした台本の done を送る だけが出ているとき（前の回が途中で止まった）：plan/scripts.md の 制作済み NNNN を確かめて、reports/outbox/scripts-done-YYYY-MM-DD.json に {"done": [...]} を書いて `node tools/run.mjs scripts <ファイル>` だけやる。

## 2. 動画にする
作るのは 1.a で取り込んだ承認済みの台本だけ（台本の文はそのまま使う。fix は指示どおりに直してから）。moshimo-analytics の notes/insights.md・最新の analysis/YYYY-MM-DD.md の 傾向・data/tiktok-studio.jsonl を読んで、伸びている型・避ける型を反映する。plan/STRATEGY.md（最優先。特に 0. 2026/11/02〜の方針 と 8. TikTok基準の作り）→ docs/PRODUCTION.md（最後まで。2. 構成 の v2 の形）→ plan/RULES.md の順に読んで完全に従う。何を作るかは PRODUCTION.md の決め方（blueprint の priority → 1日4本＝社会の消えたら3本＋人体の限界1本（2026/11/03〜。4本目は当たり型だけ）、挑戦は週3本まで（挑戦の回は META に trial: true）→ 柱は series ごとに no 順）。新しい回は全部 META に v2: true と hookLine と series。0秒目＝サムネ・0.6秒以内に異変・いつもの日常なし・10〜12秒ごとに次を見たくなる一言・61〜65秒。在庫に v2 になっていない回が残っていたら v2 に作り直す（見本は engine/videos/0102.js）。queue には 皮肉（社会の消えたら・図星）・人体の限界・皮肉・皮肉（2026/11/03〜 1日4本。皮肉が続くところは 社会の消えたら と 図星 を交互にする） の並びで差し込む。数字は必ず WebSearch・WebFetch で一次資料まで確かめ、確かめられない数字は使わない。1本ごとに静止画（0・0.4・1・2・3秒を含む15枚）を書き出して全部目で見て、0秒目がサムネとして成り立つか・0.6秒までに異変があるか・隠れ・文字のかぶり・はみ出し・暗すぎ・エラーがないかを確かめてから commit。新しい再利用シーンは PRODUCTION.md のシーン一覧に足す。避けるもの：実在の国が消える話・戦争・実在の人物（政治家・有名人・ネットミームの元の人も）・実在ブランドの見た目・生々しいグロ・食事や水を極端に削るお題。
1本できるごとに commit・push する（途中で止まっても、できた分は次の朝 5:20 に書き出される）。全部できたら、在庫（plan/queue.txt の書き出し前の本数）を最後の返答に書く。
最後の返答：作った番号・タイトル・シリーズの区分と hookLine、台本の候補を出したならその番号。
