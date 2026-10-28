# 台本と動画の作り方（毎週の制作タスク用）

このファイルは、毎週の制作を担当する Claude が最初に読む手順書。もしもラボはインスタのリール用に、もしも○○が消えたら／○○したらどうなる？を3Dアニメと実データで見せる約60秒の動画を作っている。

## 毎週やること

0. 最初に `plan/STRATEGY.md`（運用戦略）を読む。お題の選び方と並べ方はこれに従う
1. `plan/queue.txt` と `state/rendered.txt` を見て、まだ書き出されていない在庫が何本あるか数える。在庫の中の 柱（series のある回）と 派生・挑戦 の本数も数える
2. 在庫が21本を下回っていたら（1日3本投稿をずっと続けるので、1週間分の21本を常に持つ）、在庫が28本になるまで作る（1回のタスクで最低7本）。何を作るかは次の順で決める：
   - `"priority"` が付いた行（解析担当からの依頼）を最優先
   - 週の配分（柱15：派生3：挑戦3、STRATEGY.md の 3）に近づくように、足りない枠から作る。柱の中の配分は STRATEGY.md の目安に合わせる
   - 柱は blueprint の `slot: "柱"` の行を、`series` ごとに `no` の順で。派生は `slot: "派生"` の行。挑戦は `slot: "挑戦"` の行から、virality S を優先して `no` の順
   - 柱の候補が足りないときは、STRATEGY.md の柱シリーズの型で新しいお題を blueprint の末尾に足してから作ってよい（no は 701 以降の空き番号。series と slot を付ける。plan/RULES.md の書式に合わせる）
3. 1本ごとに、下の手順で `engine/videos/NNNN.js` を作る（NNNN は blueprint の `no` を4桁にしたもの。例 no 2 → 0002、no 701 → 0701。その番号のファイルがもうあるときは 05xx・08xx など空いている番号にして blueprint の made にその番号を書く）
4. できた番号を `plan/queue.txt` に入れ、blueprint の該当行に `"made": "NNNN"` を付ける。入れる場所：まだ書き出していない在庫の並びが 柱・（派生か挑戦）・柱 のくり返しになるように差し込む（12:00 と 20:30 が柱、18:00 が派生・挑戦になる）。同じ series が2本続かないようにする。並びがすでにそうなっているときは末尾でよい
5. commit して `main` に push する（GitHub Actions が毎朝7時台に queue の順に書き出す）

作れないお題（必要な絵が今のエンジンでは無理、確かな数字が見つからない など）は飛ばして、blueprint の行に `"skip": "理由"` を付けて次へ進む。

## シリーズ回の作り方（STRATEGY.md の柱）
- 絶滅ボタン：0501 ゴキブリの赤い絶滅ボタンの演出（押すまでのカウントダウン → 押すと消える）をシリーズ共通の型にする。結果は数字とお金だけで終わらせず、人間の暮らしがどう変わるかまで言い切る（蚊の回が手本）
- 人体の限界：経過時間のチップで体の変化を段階的に見せる（0004 が手本）。真似すると危ないものは字幕で 真似しないで と入れる。断食・水を飲まないなど食事を極端に削るお題は作らない
- 日本人全員で：0005 ジャンプのように、0秒目から全員が動くまでのカウントダウン
- お財布のもしも：見る人の財布に入る・出ていく金額を、1人あたり・1世帯あたりの数字で必ず出す
- ヤバい順：候補を5つ並べて下の順位から1つずつ見せ、1位を最後に。順位は確認した数字で決める（blueprint の並びと違ってよい）
- シリーズ回の最後の質問は、できるだけ 次に○○してほしいのは？ の形（例：次に絶滅ボタンを押したい生き物は？）。次回のお題のコメントが集まる

## 1本の作り方

### 1. 数字を確定する（最重要）
- blueprint の `data` は全部（要確認）。WebSearch と WebFetch で一次資料（省庁・業界団体・企業IR・論文）まで確認して、数字と年を確定する
- 確認できない数字は使わない。お題の展開を変えるか、別の確かな数字に差し替える
- 計算で出した数字（例：台数×1台あたり件数）は画面に（推計）と書く
- 画面の数字ラベルには必ず年（2025年 など）を入れる。まとめカードに出典を書く

### 2. 構成（2026/10/28〜 v2：TikTok基準。インスタ・YouTube も同じ動画）

TikTok では全動画で 0:01〜0:02 に一番離脱されていた（平均視聴16〜19秒・最後まで見る人2〜5%）。最初の1秒で「もう何かが起きてる」状態にして、途中も離脱させない作りにする。新しく作る回は全部この形。META に `v2: true` を必ず入れる（入れないと書き出しが後回しになる）。

| 出来上がりの秒 | 中身 |
|---|---|
| 0秒目（1フレーム目） | サムネイル。インスタ・TikTok・YouTube の一覧に並ぶ絵になる。タイトル（エンジンが全動画同じ位置・大きさで出す）＋お題の主役（消える生き物・ボタン・人など）がはっきり見える構図。主役はタイトルの下 620〜1050px あたりに大きく |
| 0〜0.6秒 | もう異変が起きる（消える・押す・止まる・数字がドン）。カウントダウンは0.6秒以内に0になるもの（例：絶滅ボタンを押すまで 0:00.50） |
| 0〜約2秒 | ナレーションは META.hookLine（例：日本中のカラスが、一斉に消えた。）を0秒から読む。タイトルを読み上げるのではなく、起きたことを言い切る一言。15〜18字くらい |
| 約2〜6秒 | 最初の字幕は「この先が気になる一言」。例：ゴミ荒らしは消える。でもヤバいのは1年後。／1位は意外なあいつ。 いつもの日常を見せる場面は作らない（必要なら途中で2秒以内の回想にする） |
| 6〜48秒 | 経過時間か規模で4〜5段階。10〜12秒に1回は次を見たくなる一言を字幕に入れる（でも本当にヤバいのはこの後／次の数字で全部ひっくり返る など）。答え・1位・一番の数字は後ろに取っておく |
| 48〜56秒 | 結果。字幕は 結果：〜 で言い切る（人への影響まで） |
| 56〜59秒 | 最後の字幕は、ひと言で答えられる質問 |
| 59秒〜 | まとめカード。最後のカットは冒頭に似せてループさせる |

- blueprint の行に hookLine があればそれを使ってよい（hook_v2 に 作り直し済み とある行は hook も v2 の案）。hook_v2 に 作るときに v2 の冒頭で作り直す とある行は、hook と beats の最初の段階が旧方式なので、v2 の形に考え直してから作る
- 長さは 61〜65秒（TikTok の収益化は1分を超える動画だけが対象。60秒ちょうどや60秒未満は不可）
- タイトルは エンジンが 0〜1.4秒に出して 1.9秒で消す。ショットの中で el.title を触らない（v2 では上書きされる）。タイトルは2行以内・1行9字くらいまで（大きく出すため）
- 古い作り（いつもの日常あり）の回を v2 に直すときは、runStory（workoutVideo なら cfg）に `cut: [[2.5, 6.0]]` のように元の秒の区間を渡すと、その区間がまるごと抜けて、字幕・効果音・BGMの強調の秒も自動でずれる（長さも短くなる）。抜いたあとの場面のつながり（消えたはずの物がまた映るなど）は必ず直す。見本は engine/videos/0102.js（カラス）
- 確認の静止画に 0・0.4・1.0・2.0・3.0 秒を必ず入れて、0秒目がサムネとして成り立っているか、0.6秒までに異変が起きているかを目で見る

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
  - タイトル（冒頭だけ）：250〜480px、ロゴ：左上に固定。タイトルが出ている間は上部に暗い帯が自動で入る（表紙＝最初のフレームでも読めるように）。最初のフレーム（0秒）は必ずタイトルを出す
  - 主役（人・看板・グラフ）は 1050px より上に置く。看板やグラフが下にかぶるショットは、ショット関数の最初で lift(px) を呼ぶと絵全体が px だけ上にずれる（story.js。230〜460 くらい）
  - 下から20%と右端120pxはインスタのボタンがかぶるので重要な物を置かない
- 文字のセンターぞろえは overlay.js の hang が自動でやる（行末の。、はぶら下げ、かっこ・？！は空きを詰める）。字幕・タイトル・数字ラベルは必ず SUBS / titleHtml / setTop / endStats 経由で出し、innerHTML を直接書かない
- 字幕に +1分。のような経過時間を書かない（すぐ上のチップと二重になる）。時間はチップ（hudTime）だけで見せる
- ナレーション：v2 では META.hookLine（なければタイトル）を0秒から、字幕を字幕の出る時刻から Gemini TTS で自動で読む（tools/narrate.mjs。v2 は全体をテンポよく読む声の指定）。最初の字幕は hookLine を読み切れる時刻（1秒に7〜8字の目安で、だいたい2.2〜2.8秒）から出す。字幕1つの時間で読み切れる長さにする（目安：1秒に6〜7字）。（）の中は読まれない。読み間違えそうな語は META.narr に { 字幕の文字: 読み } で書く（例 { '2×24kg': '24キロ2つ' }）
- 字幕は1行14字くらいまで。長い文は `<br>` で2行に。カメラは主役がタイトル・字幕とかぶらない構図にする
- 強調の効果音：META.impacts に秒数の配列（例 [19.0, 34.7]）を入れると、その瞬間にドン＋キンの効果音が鳴り、直前に音楽が一瞬引く（ナレーションで下がらない別トラック）。大きな数字が出る瞬間に使う
- blueprint にない番号で作る回（0036 以降の空き番号）は、解析で比べられるよう META に hookType（H1〜H6）と cat（blueprint のカテゴリ名）も入れる
- META に入れるもの：id, series（blueprint の series をそのまま。柱シリーズの回だけ。入れると表紙にシリーズのバッジ、まとめカードに フォローして次の回を待ってて が出る）, hookType, cat, title, titleHtml, ask（最後の質問。20字以内。まとめカードに出て、キャプションにも 質問＋コメントで教えて。を出典の前に入れる）, mood（tension / mystery / calm / emotional / hopeful）, seed, hits（ドンと鳴らす秒）, risers, caption（検索されそうな言葉を自然に入れる。最後に出典）, hashtags（5個まで。1つ目は もしもラボ）, endStats, sources

### 4. 確認（必ずやる）
```
npm ci
CHROME_PATH=<chromium> node tools/render.mjs --video NNNN --stills 0,0.4,1,2,3,10,16,22,28,34,40,46,52,57,61 --outdir out/stills
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
- scenes/nursery.js：病院の新生児室（透明なベビーコット3列×3台・くるまれた赤ちゃん・看護師・新生児室の札・窓・時計）。COTS[i].baby、setBabies(i→0..1) で赤ちゃんの有無、nurse（makePerson）、setNurseryLight で day / night。天井は下向きの面だけなので高い位置からも撮れる
- scenes/station.js：島式ホームの駅（架空の もしも台駅・2本の線路・屋根・発車標・駅名標・架線柱・まわりのビル）。makeTrain({cars, side, freight}) で通勤電車か機関車＋コンテナ車（setX・setDoors・setLights）、setBoard(rows, {stop:'運転見合わせ', blink}) で発車標、makeRiders(n, seed, 範囲) でホームの人（set(k, t, {look, board, side})）、makeQs で？吹き出し、setStationEnv で day / dusk / night
- scenes/pets.js：ローポリの飼い猫と小物。makeCat({coat: orange / gray / white / black / calico})、catPose（stand / sit / loaf / sleep）、catWalk・catBreath（歩き・しっぽ）、makeBowl（setFood で量）、makeCatBed、makeToyBall
- scenes/town.js：郊外の住宅街（十字の道と両側の一戸建て・街灯）。setTownEnv で day / dusk / night、setVacant(k, grow) で q<k の家を空き家に（窓の明かりが消え、壁と屋根がくすみ、庭に草）。HOUSES で家の一覧
- scenes/line.js：一本道にどこまでも続く人の行列（先頭は z=0、列は +z へ、1人 0.5m）。先頭60人は makePerson、その先3,000人は InstancedMesh、さらに先は帯で何kmでも伸ばせる。setLine(count, {pop})、setLineEnv('day'|'dusk', {fogNear, fogFar})、markers（10mの杭と50m看板）、kmPosts(on, size)（1kmごとの看板）、front（先頭の札）、lineSky（空撮では cam の位置に動かす）
- scenes/dog.js：ローポリの飼い犬と小物。makeDog({kind: shiba / lab / small, coat})、dogPose（stand / sit / lie）、dogWalk・dogIdle、neckPos・handPos（リードの両端）、makeLeash（たるむリード）、makeCollar・dropCollar、makeDogHouse、makeHarness（盲導犬の白いハーネス）
- scenes/factory.js：お弁当工場（白い壁・天井照明・2本のベルトコンベア・お弁当トレー・白衣/帽子/マスクの作業員）。LINES（各ラインの workers / trays）、setLine(dist, {pack, t})、setWorkers(fn)（持ち場が空くとおかずが欠ける）、setFactoryLight で day / dim、factorySign（タイトルと重なるときは隠す）、makeWorker(r)
- scenes/delivery.js：宅配の玄関先（一戸建ての玄関・ステップ・表札・植木鉢・道路・向かいの家）と架空の配送車。makeVan（文字なし、setDoor・setHazard）、makeCourier、carryPose、makeParcel、makePile(scene,{cols,rows,layers})（setN）、canopy（タイトルにかかる構図では隠す）、setPorchEnv で day / dusk / night
- scenes/spider.js：クモと虫の部品（どのシーンにも足せる）。makeSpider（.userData.anim）、makeWeb({r, spokes, rings})（ローカルxy平面に張る巣。userData.set(k) で出方0..1、shake(t)）、makeFly（flap）、makeSwarm(n, seed, 範囲)（InstancedMesh の虫の群れ。set(数, t) でふらふら飛ぶ）
- scenes/mouselab.js：研究室（白い壁・実験台・マウスのケージ6個・棚のフラスコ・顕微鏡・白衣の研究者 researcher）。makeRodent({kind: rat / mouse, coat}) でローポリのネズミ（.userData.anim(t, moving)）、setMice(k, t) でケージのマウスの割合、setLabLight で day / night
- scenes/crowdfield.js：見渡すかぎりの平原に人がぎっしり立つ「人の四角」（1m²に2人）。setCrowd(m²) で正方形の面積、setPeopleN(side) で近くの人形、setScale(s) で km 規模（1未満で模様を消して平均色）、makePatch(color).userData.setSize(m) で地面の正方形、crowdSky はカメラ位置に動かす、setCrowdEnv で day / dusk
- scenes/bear.js：ローポリのツキノワグマと小物。makeBear()（+x 向き、userData.anim(t,{walk,head})、userData.stand(k) で後ろ足で立つ）、addMountains(scene,{z,color,snow}) で遠くの山並み、makeGarbage()（ゴミ置き場、scatter(k) で袋が散らばる）、makeBearSign(textSprite, 文字)（黄色い注意看板）
- scenes/bank.js：架空の もしも銀行 の支店（ATMコーナー・入口・歩道・道路）。setBankEnv で day / dusk / night、setATM(i, ok / empty / off) でATM画面、makeQueue(n, seed).set(k, t, {look, qsOn, arrive}) で歩道に伸びるATMの行列、setShutter(k)、makeBills(n)（架空の紙幣色の札束）、bankSign（タイトルと重なる構図では隠す）
- scenes/highway.js：片側3車線の高速道路（中央分離帯・ガードレール・架空の案内標識 もしも台）と道ばたの物流倉庫。makeTruck({kind: box / tanker / flat / garbage})（前が +x、キャブの運転手が見える。setDriver・setHazard・roll）、makeHwCar、LANES・laneX(t, speed, off, dir) で流れる車、WAREHOUSE・DOCKS（積み下ろし口8つ）、makeCratePile(n, seed) の setN で段ボールの山、setHighwayEnv で day / dusk / night
- scenes/deerpark.js：古都の公園（芝生・松・石灯籠・朱色の鳥居・前の道路と横断歩道・向かいの低い建物）とローポリの鹿。makeDeer({kind: buck / doe / fawn})、deerWalk・deerGraze・deerBow（おじぎ）、makeHerd(max, seed, 範囲) で数千頭の群れ（setN(n)、clear(cx,cz,r) で手前だけ空ける）、setLawn(k) で芝生→土、makeCar（setBrake）、makeSenbei、setParkEnv で day / dusk
- scenes/farm.js：日本の農村（田んぼ3×2枚・キャベツ畑・農家の家と納屋・山・電柱）。setRice(grow, gold) で稲、setVeg(k) でキャベツ、setWeeds(k) で耕作放棄（雑草が伸びて田の水が泥色に）、makeFarmer(r)（麦わら帽子の農家）と farmerWork(p, t) で腰をかがめた作業、makeTractor（架空色、userData.spin）、setFarmEnv で day / dusk / gray
- scenes/grocer.js：スーパーの青果・卵・お米売り場（野菜の平台・卵の冷蔵ケース・米袋の山・吊り看板 やさい / たまご / お米）。setStock({veg, egg, rice}) で残る量、setSoldOut({...}) で品切れの札、tagsOn で国産の値札、setGrocerLight で day / dim
- scenes/xbutton.js：絶滅ボタンシリーズ共通の赤いボタン（台・キャップ・名札・押す手。どのシーンにも置ける）。makeXButton({label}) の userData に press(k)・hand(k)・labelOn、xCountdown(残り秒) で 0:01.40 の表示、xHook(t, 押す秒) で押すタイミング
- scenes/hornet.js：スズメバチまわり。makeHornet、makeHornetNest（マーブル模様の巣・原点が吊るす点）、makeEave（家の壁と軒。userData.nestAt。scale 0.62 で物置）、makeHive（重箱式の巣箱）、makeBeeBall(n)（熱殺蜂球。set(集まり具合, t, 熱)）、makeCaterpillars(spots)（毛虫。set(k, t)）
- scenes/plaza.js：駅前広場（架空の もしも台駅の駅舎とひさし・タイル・ベンチ・植え込み・時計の柱）とローポリのハト。makePigeon（userData.anim(t,{walk,peck,fly})）、makeFlock(n, seed, 範囲).set(数, t)、makeDroppings（setK でフンの量）、makePlazaPeople、LEDGE、setPlazaEnv で day / dusk
- scenes/beach.js：夏の砂浜と波打つ海（砂浜・海底・波打ちぎわの泡・パラソル・遠くの山）。setSea(t,{level, amp}) で波と海面の高さ、floorY(z)、makeSwimmers(n, seed, 範囲).set(k, t)（0 浜で待つ→1 海に入る）、makeFarCrowd、makeGauge（目盛りの柱、setMark で赤い線）、PARASOLS、setBeachEnv で day / dusk
- scenes/appliances.js：ブランドなしのローポリ家電（makeTV / makeMicrowave / makeWasher / makeFridge / makeAircon）と、5つの台座にダメージメーターが付いたラインナップ（aLineup、setASlot(i, {show, meter, word, glow, t})、aLineupIdle、setALabels）。ヤバい順の家電回用
- scenes/xbutton.js：絶滅ボタンシリーズ共通の赤いボタン（台・キャップ・名札・押す手。どのシーンにも置ける）。makeXButton({label}) の userData.press(k)・hand(k)・labelOn、xCountdown(残り秒) で 0:01.40 の表示、xHook(t, 押す秒) で押すタイミング
- scenes/hornet.js：スズメバチまわりの部品。makeHornet、makeHornetNest（マーブル模様の巣・原点が吊るす点）、makeEave（家の壁と軒。userData.nestAt に巣の位置。scale 0.62 で物置）、makeHive（重箱式の巣箱）、makeBeeBall(n)（熱殺蜂球。set(集まり具合, t, 熱) で赤く光る）、makeCaterpillars(spots)（毛虫。set(k, t)）
- scenes/plaza.js：駅前広場（架空の もしも台駅の駅舎とひさし・タイル・ベンチ・植え込み・時計の柱）とローポリのハト。makePigeon（userData.anim(t,{walk,peck,fly})）、makeFlock(n, seed, 範囲).set(数, t)、makeDroppings（setK でフンの量）、makePlazaPeople、LEDGE、setPlazaEnv で day / dusk
- scenes/beach.js：夏の砂浜と波打つ海（坂の砂浜・海底・波打ちぎわの泡・パラソル・遠くの山）。setSea(t,{level, amp}) で波と海面（level を上げると砂浜が沈む）、floorY(z)、makeSwimmers(n, seed, 範囲).set(k, t)（0 浜で待つ→1 海へ）、makeFarCrowd、makeGauge（目盛りの柱、setMark で赤い線）、PARASOLS、setBeachEnv で day / dusk
- scenes/appliances.js：ブランドなしのローポリ家電（makeTV / makeMicrowave / makeWasher / makeFridge / makeAircon）と、5つの台座にダメージメーター付きのラインナップ（aLineup、setASlot(i, {show, meter, word, glow, t})、aLineupIdle、setALabels）。ヤバい順の家電回用
- scenes/mites.js：小さな這う虫の部品（どのシーンにも足せる）。makeMite({kind: dust / tick})（8本脚の室内ダニ・マダニ）、makeBedBug（6本脚の平たいトコジラミ）、どちらも .userData.anim(t, moving)。makeCrawlers(n, seed, {x0,x1,z0,z1,y,size,color,legs}).set(数, t, speed) で面の上を這う InstancedMesh の群れ、makeLitter(n, seed, 範囲).set(k) で落ち葉が厚く積もる

## 着地は人への影響で言い切る（2026/10/20 ゆうとの指摘・最重要）
- 結果は「何がいくつ消えた」で終わらせない。それで人間の暮らし・お金・体・心がどう変わったかを数字で言い切る（例：蚊の回＝マラリアだけで年61万人が助かる）。
- 流れは 何が起きた → 人数・世帯 → お金 → 体や心や生活 → 結果（人への影響）。途中の数字も全部この結論につながる順に並べる。
- 見た人が納得して、だれかに教えたくなる一文になっているかを毎回チェック。数だけ・比較だけで終わる台本は作り直し。
- 推計や単純計算で言い切るときは、画面のチップとキャプションに（推計）（単純計算）と条件を書く。
- 最後の質問も、結論とつながる問いにする（関係のない好き嫌いの二択にしない）。
- 字幕の時間：結果 48.1〜53.8、ひねり 53.9〜56.1、質問 56.2〜59.4（結果の一文はナレーションが間を取って長くなるので約5.7秒取る）。ひねりは短く（15字以内）。
- 場面の効果音は META.sfx = [[秒, 種類, 値]] で入れる。種類：poof（消える）、howl（遠吠え）、whoosh、meter（値0〜1、高いほど長く不穏）、alarm、bubble、buzz、caw、skitter、drone。数字の強調は今まで通り META.impacts。
- 長さは60秒に縛らなくていい企画もある（候補を並べて比べる回など）。その場合も結果・ひねり・質問の字幕の並びは同じ。
