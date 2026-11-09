# ニュースアカウント（インスタのみ・完全自動）

海外のちょっと変わった話・へぇな話・ほっこりする実話を、写真＋見出しのカルーセルで1日数本、承認なしで自動投稿する。手本はモイムード（@moo_i_mood.jp）と soo（@soo.zip_jp）。もしもラボ・クイズ・いつわ劇場とは別のアカウント・別のサーバー。TikTok・YouTube には出さない。

## 全体の流れ（2026/11/09〜 文章は Claude。Gemini は使わない）

```
8:41   GitHub Actions の news-collect.yml（Claude なし）
       news/sources.json の海外ニュースの RSS からネタを集め、元記事を開いて本文と写真の候補まで確かめ、
       news-data ブランチの candidates.json に置く。投稿サーバーに在庫を聞いて、書く本数（次の26時間の枠－在庫＋予備2、最大10）も入れる
9:23   定期タスク SNS 毎日の運用 の today.mjs が ■ make-news を出す → Opus のサブエージェントが ops/make-news.md のとおりに
       候補から選んで見出しとキャプションを書き、news-data の queue/ に置いて news-build.yml を dispatch
すぐ   news-build.yml（Claude なし。3時間ごとにも見る）：元記事の写真を取ってきて tools/news/render.py で 1080x1350 の画像にし、投稿サーバーへ送る。
       送れた回は done.txt、写真が取れなかった回は failed/ に移す
VPS    POST_TIMES の時刻ごとに1本、インスタにカルーセルで投稿（承認なし）。72時間より古いネタは捨てる。
       数字（閲覧・いいね・保存・シェア）を 24時間・72時間・7日で記録。失敗と在庫切れだけ SNS司令室に知らせる
```

PC は使わない（全部クラウド・GitHub・VPS で動く）。

## ネタと文章の決めごと

- 選ぶ型（伸びている型）：身近な物の知らなかった秘密／動物・自然の珍しい光景／人のやさしさ・恩返しの実話／一般人のありえないうっかり／ギネス記録・世界に1つの物／写真1枚で伝わる科学の意外な事実
- 出さない話：人が亡くなる・大けが・残酷な事件、性犯罪、子どもや動物への虐待、自殺、災害の被害、政治・選挙・宗教・戦争・民族の対立、一般人を犯罪者扱いする話、芸能ゴシップ・炎上、医療・健康・お金で真に受けると害が出る話、日本のニュース
- 事実は記事に書いてあることだけ。一般人の名前は出さない。人を見下さない
- 見出し：2〜3行・1行14文字以内。最後の行（黄色）がオチ
- キャプション：です・ます調、280〜450字、4〜6段落。1文目で何が起きたかを言い切る → 詳しい事実と日本人向けの補足 → 軽いひとこと＋絵文字1つ → 問いかけ1行 → 📸 出典 → ハッシュタグ3〜5個
- Reddit は使わない（API の商用利用は Reddit との契約が要る）

## 写真について（2026/11/09 ゆうとの決定：元の写真をそのまま使う）

- 元記事の写真を使うので、写真の権利は元の撮影者・媒体にある。日本の法律では、出典を書いても引用の要件（自分の文が主・写真が従、など）を満たさなければ無断転載になりうる
- インスタは 2026/4/30 から、他人の写真・カルーセルを主に載せるアカウントをおすすめに出さなくなった（自分の文字・解説を足して「大きく手を加えた」ものはオリジナル扱い）。1枚目に必ず自分の見出しを載せ、キャプションは自分の文で書くのはそのため
- 撮影者・媒体から削除の依頼や、インスタから著作権の通知が来たら、その投稿はすぐ消す（反論しない）。同じ媒体から2回来たら、その媒体を news/sources.json から外す
- 写真に入っている透かし（ウォーターマーク）は消さない

## 立ち上げの増やし方

新しいアカウントがいきなり1日10本出すとスパムに見られやすいので、段階を踏む。POST_TIMES は /etc/news.env か `/an/control`（act: times）で変える。

| 期間 | 1日の本数 | POST_TIMES の例 |
|---|---|---|
| 1週目 | 4本 | 07:30,12:10,18:30,21:30 |
| 2週目 | 6本 | 07:30,10:00,12:10,15:30,18:30,21:30 |
| 3週目から | 8本 | 07:30,09:30,12:10,14:30,17:00,19:00,21:00,22:30 |

競合は1日10〜15本（2026/11 時点）。8本で数字が伸びていれば10本まで上げる。

## 1回だけのセットアップ

済み（2026/11/09）：アカウント @nanikore.tsushin（Instagram のユーザーID 17841459481206894）、VPS の /news/、GitHub の Secrets。

1. インスタで新しいアカウントを作る（ゆうと）→ プロアカウント（クリエイター）に切り替える → プロフィール写真・名前・自己紹介を入れる
2. developers.facebook.com のもしもラボのアプリ → Instagram → API setup with Instagram business login → アカウントを追加 → Generate token → `https://graph.instagram.com/v25.0/me?fields=user_id,username&access_token=TOKEN` で user_id を控える（クイズのときと同じ手順）
3. VPS（Mac のターミナルから ssh で入る）：`curl -fsSL https://raw.githubusercontent.com/oishi-thomaz/moshimo-lab/main/server/install-news.sh -o install-news.sh && sudo bash install-news.sh` → `sudo nano /etc/news.env` に IG_USER_ID と IG_TOKEN を入れる → `sudo systemctl restart news`
4. GitHub の Settings → Secrets and variables → Actions の Secrets に NEWS_BASE_URL（https://ドメイン/news）と NEWS_SECRET（install-news.sh の最後に出た値）
5. アカウント名とタグは なにこれ通信 が既定（変えるときは同じ画面の Variables に NEWS_BRAND と NEWS_TAG）
6. Actions → news-collect → Run workflow で候補を作る。次の 9:23 の運用で Claude が書く。できた画像は news-build の実行結果の Artifacts で見られる

## 動かし方

VPS で（Mac のターミナルから ssh で入ってから）：

- 状態：`curl -s http://127.0.0.1:8791/news/health`
- 止める・再開：`curl -s -X POST -H "x-secret: $(sudo grep ^HOOK_SECRET= /etc/news.env | cut -d= -f2)" -H 'content-type: application/json' -d '{"act":"pause"}' http://127.0.0.1:8791/news/an/control`（再開は resume）
- 投稿時間を変える：同じ形で `-d '{"act":"times","times":["07:30","12:10","18:30","21:30"]}'`
- 数字を見る：同じ形で GET `http://127.0.0.1:8791/news/an/export?days=7`
- サーバーの入れ替え：`sudo bash update-servers.sh <コミット>`（ニュースのサーバーも入れ替わる）
