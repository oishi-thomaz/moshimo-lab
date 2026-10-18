# 台本と動画の作り方（毎週の制作タスク用）

このファイルは、毎週の制作を担当する Claude が最初に読む手順書。もしもラボはインスタのリール用に、もしも○○が消えたら／○○したらどうなる？を3Dアニメと実データで見せる約60秒の動画を作っている。

## 毎週やること

1. `plan/queue.txt` と `state/rendered.txt` を見て、まだ書き出されていない在庫が何本あるか数える
2. 在庫が7本を下回っていたら、`plan/blueprint.json` を `no` の順に見て、まだ `made` が付いていないものから在庫が14本になるまで作る（1回のタスクで最低7本）
3. 1本ごとに、下の手順で `engine/videos/NNNN.js` を作る（NNNN は blueprint の `no` を4桁にしたもの。例 no 2 → 0002）
4. できた番号を `plan/queue.txt` の末尾に1行ずつ追加し、blueprint の該当行に `"made": "NNNN"` を付ける
5. commit して `main` に push する（GitHub Actions が毎朝7時台に queue の順に書き出す）

作れないお題（必要な絵が今のエンジンでは無理、確かな数字が見つからない など）は飛ばして、blueprint の行に `"skip": "理由"` を付けて次へ進む。

## 1本の作り方

### 1. 数字を確定する（最重要）
- blueprint の `data` は全部（要確認）。WebSearch と WebFetch で一次資料（省庁・業界団体・企業IR・論文）まで確認して、数字と年を確定する
- 確認できない数字は使わない。お題の展開を変えるか、別の確かな数字に差し替える
- 計算で出した数字（例：台数×1台あたり件数）は画面に（推計）と書く
- 画面の数字ラベルには必ず年（2025年 など）を入れる。まとめカードに出典を書く

### 2. 構成（全本共通・変更しない）
| 時間 | 中身 |
|---|---|
| 0〜2秒 | フック。0フレーム目からタイトル（titleHtml）と動いている映像。1.5秒以内に異変かカウントダウン |
| 2〜6秒 | いつもの日常 |
| 6〜48秒 | 経過時間（+1分、+1時間…）か規模で4〜5段階。各段階で上部に数字をカウントアップ表示 |
| 48〜58秒 | 結果。最終状態の映像と決め手の数字。字幕は 結果：〜 で言い切る。消えた物が戻る・元通りになる展開は禁止 |
| 55.6〜59.5秒 | 最後の字幕は、見た人がひと言で答えられる質問にする（コメントを集めるため）。例：あなたが一番困るのは？／住むなら昭和と今どっち？／あなたの最長の徹夜は何時間？ |
| 59.5〜64.5秒 | まとめカード（endStats・ask・sources）。最後のカットは冒頭に似せてループさせる |

ほかの決めごとは `plan/RULES.md` を守る（避けるお題、実在ブランドの見た目禁止など）。

### 3. エンジンの使い方
- 見本は `engine/videos/0001.js`（コンビニ）。構造をまねる：ショット関数の配列 `SHOTS`、字幕 `SUBS`、`window.META`、`setupCards(window.META)`、最後に `window.renderAt` と READY
- 共通部品：`engine/lib.js`（乱数、イージング、人物 makePerson / randPerson / walkAlong、空、？吹き出し）、`engine/city.js`（街・コンビニ・車・街灯・夜景、setEnv で dusk / night / dark）、`engine/market.js`（スーパー店内）、`engine/overlay.js`（字幕・上部の数字・左の経過時間・まとめカード）
- 新しい場面（家の中、学校、宇宙、体の中、海、田んぼ など）は `engine/scenes/<名前>.js` に再利用できる形で作る（Scene を作って返す関数＋操作用の関数をexport）。1本専用の小物は動画ファイルの中でよい
- 見た目の統一：ローポリ、フラットな色、人物は makePerson（目は2つの点。他アカウントのキャラに似せない）、ブランドロゴや実在の店の配色は使わない（店名は もしもマート のような架空名）
- 画面の文字の配置（1080×1920・全動画共通。index.html で固定なので動画側で位置は変えない）：見る人の目線が上下に行き来しないよう、読む情報は中央の1列にまとめてある
  - 経過時間などのチップ（setHud）：字幕のすぐ上 1058〜1140px
  - 字幕（SUBS）：1170〜1350px
  - 数字（setTop）：字幕のすぐ下 1372〜1510px
  - タイトル（冒頭だけ）：250〜480px、ロゴ：左上に固定
  - 主役（人・看板・グラフ）は 1050px より上に置く。看板やグラフが下にかぶるショットは、ショット関数の最初で lift(px) を呼ぶと絵全体が px だけ上にずれる（story.js。230〜460 くらい）
  - 下から20%と右端120pxはインスタのボタンがかぶるので重要な物を置かない
- 文字のセンターぞろえは overlay.js の hang が自動でやる（行末の。、はぶら下げ、かっこ・？！は空きを詰める）。字幕・タイトル・数字ラベルは必ず SUBS / titleHtml / setTop / endStats 経由で出し、innerHTML を直接書かない
- 字幕に +1分。のような経過時間を書かない（すぐ上のチップと二重になる）。時間はチップ（hudTime）だけで見せる
- 字幕は1行14字くらいまで。長い文は `<br>` で2行に。カメラは主役がタイトル・字幕とかぶらない構図にする
- META に入れるもの：id, title, titleHtml, ask（最後の質問。20字以内。まとめカードに出て、キャプションにも 質問＋コメントで教えて。を出典の前に入れる）, mood（tension / mystery / calm / emotional / hopeful）, seed, hits（ドンと鳴らす秒）, risers, caption（検索されそうな言葉を自然に入れる。最後に出典）, hashtags（5個まで。1つ目は もしもラボ）, endStats, sources

### 4. 確認（必ずやる）
```
npm ci
CHROME_PATH=<chromium> node tools/render.mjs --video NNNN --stills 0.5,2,5,10,16,22,28,34,40,46,52,57,61 --outdir out/stills
```
- 全部の静止画を Read で目で見る。チェック項目：主役が建物・木・車に隠れていないか／文字と主役がかぶっていないか／字幕が3行以上になっていないか／数字のカウントアップが最終値に着いているか／夜のシーンが暗すぎないか／ページのエラーが出ていないか
- 問題があれば直して、もう一度静止画で確認。120点の状態になってから commit する
- 書き出し（mp4）は GitHub Actions がやるので、ここでは静止画の確認まででよい

### 5. commit
- 1本ごとか、まとめて commit。メッセージは `Add video NNNN: <タイトル>`
- 新しい scenes を作ったら、その使い方をこのファイルの末尾の「シーン一覧」に1行で追記する

## シーン一覧
- city.js：街の交差点・歩道・コンビニ（もしもマート）・駐車場・夜景・俯瞰の街並み（店の明かりが順に灯る演出つき）。setEnv は day / dusk / night / dark
- market.js：スーパー店内・レジの行列・棚の商品が減る演出
- story.js：動画の共通進行（runStory で SHOTS・SUBS・META を渡すだけ。毎フレーム字幕以外のオーバーレイを消してからショットを呼ぶ）、lift（絵を上にずらす）、endCard、look、countUp、hudTime、textSprite（文字の看板）、makeSparkles（消える瞬間の光の粒）
- scenes/room.js：室内セット。setRoom({sets:[...]}) で bed（寝室・寝ている人・時計・スマホ）/ desk / living（ソファ・テレビ）/ kitchen / office / ward（病室）/ toilet / showa（畳・ちゃぶ台・ブラウン管・黒電話）を切り替え、setLight で day / evening / night / dark、setClock・setScreen で時計とテレビ画面
- scenes/japan.js：日本地図の俯瞰（海・山・富士山）。ll(経度,緯度) で位置、setDots で人口の点を一斉に動かす、makeRing（波紋）、addPin、setMapEnv で day / dusk / night
- scenes/earth.js：宇宙から見た地球（大陸・雲・夜の街明かり・大気・星・月）。latLon で地表の位置、faceLon でその経度を正面に、setEarthNight で夜側
- scenes/field.js：田舎（花畑・果樹園・イチゴ畑・ビニールハウス・池と魚・森）。makeBug で ハチ / 蚊 / チョウ / 鳥、setFlowers・setFruit で花と実の量、setFieldEnv で day / dusk / night / gray
- scenes/stage.js：データ用スタジオ。makeBar（ラベル付き3D棒グラフ。nameTop・headerY で文字を棒の上にそろえる）、makeCoins（硬貨の山）、makeCrowd（人の群れ）
- scenes/hyrox.js：HYROX風のフィットネスレース会場（ランのレーン・8種目のエリア・ゴール）。makeAthlete（ランナー体型）、run（レーンを走る）、act(p, 種目番号, t, {slow})（SkiErg／スレッドプッシュ／プル／バーピーブロードジャンプ／ロー／ファーマーズ／ランジ／ウォールボールの動き）、setOthers（ほかの選手）
