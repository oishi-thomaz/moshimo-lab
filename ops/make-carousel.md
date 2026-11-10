# make-carousel：もしもラボの人気回をカルーセルにして送る（2026/11/10〜）

ゆうとの決定（2026/11/10）：
- インスタで、人気の動画をカルーセル（画像をめくる投稿）でも出す。1日2本、12:00・21:00。リールの1日4本はそのまま。
- 画像だけで話が完結するように作り込む。文字だけの画像は安っぽく見えるので作らない（どのページも動画の3Dの場面を敷く）。
- 一番大事なのは1枚目のタイトル。
- 承認してから出す（リールと同じく SNS司令室の承認待ち）。

ねらい：インスタのボーナスは日本では写真・カルーセルが対象（招待制のテスト。カルーセル・写真で月50万閲覧を3か月が目安）。リールの数字はここに乗らないので、カルーセルで積む。1本8,000閲覧前後が出るかを最初の2週間で見る（判定 11/24）。

## 手順（1回で2本）
1. 候補：`cd /home/claude/moshimo-analytics && node tools/carousel-pick.mjs 12`。インスタの閲覧が多い順に出る（作った回・公開から3日以内の回は出ない）。
   - 上から選ぶ。ただし、ギャンブル・夜のお店・性の話が中心の回（競馬・パチンコ・キャバクラ・オトナのお店など）は後回し（インスタの収益化のポリシーで対象外になりやすい）。同じ日に同じ柱（人体の限界など）を2本並べない。
2. 動画の中身を読む：moshimo-lab の engine/videos/<番号>.js の SUBS（字幕と秒）・meta（title・titleHtml・series・ask・endStats・sources）と、plan/cover-lines.json・plan/cover-picks.json（表紙の言葉と場面の秒）。
3. 場面を見る：`node tools/render.mjs --video <番号> --stills <秒,秒,…> --glonly --outdir out/carousel/<番号>/raw`（字幕ごとに、その字幕の時間の7割あたり。弱い絵なら前後の秒も撮る）。撮った絵は必ず目で見て、主役が写っている秒を選ぶ。
4. plan/carousel/<番号>.json を書く（形は tools/carousel.py の先頭）。
   - 表紙：cover は人物や異変がはっきり写る秒（plan/cover-picks.json の秒が基本）。title は動画の表紙と同じ言葉（plan/cover-lines.json の | を配列に。最後の行が黄色）。sub は めくりたくなる一言（10〜12字。結末は言わない。例 会社が3日で変わった）。series は動画の柱。
   - slides：字幕1つ＝1枚が基本（最大18枚。合計20枚まで）。text は動画の字幕を元に、めくるだけで話がわかる文に（| で改行・1行14字くらいまで・4行まで）。{…} で囲んだところは黄色（決めの一言）。数字は自動で黄色。同じ絵が続くページは秒をずらす。
   - end：最後の場面の秒、ask（動画の ask。| で改行）、source（出典。動画の sources を短く）。
5. 作って見る：`python3 tools/carousel.py plan/carousel/<番号>.json` → out/carousel/<番号>/01.jpg〜。全ページを目で見る（文字が人の顔や札にかぶっていないか・はみ出していないか・同じ絵が並んでいないか）。直したら作り直して、もう一度見る。
6. commit・push（plan/carousel/<番号>.json だけ。out/ は入れない）。
7. 送る：`gh api -X POST repos/oishi-thomaz/moshimo-lab/actions/workflows/carousel-send.yml/dispatches -f ref=main -f 'inputs[ids]=<番号> <番号>' -f 'inputs[send]=true'`。終わるのを待って（`gh api "repos/oishi-thomaz/moshimo-lab/actions/workflows/carousel-send.yml/runs?per_page=1"`）、ログに 送った：8xxx が出たか確かめる。サーバーでの番号は 8000＋動画の番号（0635 → 8635）。
8. 返答：作った回（番号・タイトル・枚数）と、送れたかどうかを2〜3行で。
