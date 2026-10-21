# 台本と動画の作り方（毎週の制作タスク用）

このファイルは、毎週の制作を担当する Claude が最初に読む手順書。もしもラボはインスタのリール用に、もしも○○が消えたら／○○したらどうなる？を3Dアニメと実データで見せる約60秒の動画を作っている。

## 毎週やること

1. `plan/queue.txt` と `state/rendered.txt` を見て、まだ書き出されていない在庫が何本あるか数える
2. 在庫が21本を下回っていたら（1日3本投稿をずっと続けるので、1週間分の21本を常に持つ）、`plan/blueprint.json` を `no` の順に見て、まだ `made` が付いていないものから在庫が28本になるまで作る（1回のタスクで最低7本）
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
  - タイトル（冒頭だけ）：250〜480px、ロゴ：左上に固定。タイトルが出ている間は上部に暗い帯が自動で入る（表紙＝最初のフレームでも読めるように）。最初のフレーム（0秒）は必ずタイトルを出す
  - 主役（人・看板・グラフ）は 1050px より上に置く。看板やグラフが下にかぶるショットは、ショット関数の最初で lift(px) を呼ぶと絵全体が px だけ上にずれる（story.js。230〜460 くらい）
  - 下から20%と右端120pxはインスタのボタンがかぶるので重要な物を置かない
- 文字のセンターぞろえは overlay.js の hang が自動でやる（行末の。、はぶら下げ、かっこ・？！は空きを詰める）。字幕・タイトル・数字ラベルは必ず SUBS / titleHtml / setTop / endStats 経由で出し、innerHTML を直接書かない
- 字幕に +1分。のような経過時間を書かない（すぐ上のチップと二重になる）。時間はチップ（hudTime）だけで見せる
- ナレーション：タイトル（0.2秒〜）と字幕が Gemini TTS で自動で読まれる（tools/narrate.mjs）。最初の字幕は2.5秒以降に出す（0〜2.5秒はタイトルを読む）。字幕1つの時間で読み切れる長さにする（目安：1秒に6〜7字）。（）の中は読まれない。読み間違えそうな語は META.narr に { 字幕の文字: 読み } で書く（例 { '2×24kg': '24キロ2つ' }）
- 字幕は1行14字くらいまで。長い文は `<br>` で2行に。カメラは主役がタイトル・字幕とかぶらない構図にする
- 強調の効果音：META.impacts に秒数の配列（例 [19.0, 34.7]）を入れると、その瞬間にドン＋キンの効果音が鳴り、直前に音楽が一瞬引く（ナレーションで下がらない別トラック）。大きな数字が出る瞬間に使う
- blueprint にない番号で作る回（0036 以降の空き番号）は、解析で比べられるよう META に hookType（H1〜H6）と cat（blueprint のカテゴリ名）も入れる
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

## 着地は人への影響で言い切る（2026/10/20 ゆうとの指摘・最重要）
- 結果は「何がいくつ消えた」で終わらせない。それで人間の暮らし・お金・体・心がどう変わったかを数字で言い切る（例：蚊の回＝マラリアだけで年61万人が助かる）。
- 流れは 何が起きた → 人数・世帯 → お金 → 体や心や生活 → 結果（人への影響）。途中の数字も全部この結論につながる順に並べる。
- 見た人が納得して、だれかに教えたくなる一文になっているかを毎回チェック。数だけ・比較だけで終わる台本は作り直し。
- 推計や単純計算で言い切るときは、画面のチップとキャプションに（推計）（単純計算）と条件を書く。
- 最後の質問も、結論とつながる問いにする（関係のない好き嫌いの二択にしない）。
- 字幕の時間：結果 48.1〜53.8、ひねり 53.9〜56.1、質問 56.2〜59.4（結果の一文はナレーションが間を取って長くなるので約5.7秒取る）。ひねりは短く（15字以内）。
- 場面の効果音は META.sfx = [[秒, 種類, 値]] で入れる。種類：poof（消える）、howl（遠吠え）、whoosh、meter（値0〜1、高いほど長く不穏）、alarm、bubble、buzz、caw、skitter、drone。数字の強調は今まで通り META.impacts。
- 長さは60秒に縛らなくていい企画もある（候補を並べて比べる回など）。その場合も結果・ひねり・質問の字幕の並びは同じ。
