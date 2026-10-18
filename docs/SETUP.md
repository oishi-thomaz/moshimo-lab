# もしもラボ 自動投稿のセットアップ

## 全体の流れ

```
毎週  Claude が次の台本を作って GitHub に追加（engine/videos/NNNN.js と plan/queue.txt）
毎朝7:17  GitHub Actions が次の1本を書き出し → BGMを付ける → VPS に送る
       ↓
VPS   LINE に「承認待ち」（動画・キャプション・ボタン）を送る。12:00 と 18:00 にまだ承認待ちなら再通知
       ↓  ゆうとが LINE で「承認する」を押す
VPS   20:30 に Instagram へリールを投稿 → 投稿したURLを LINE に送る
```

ゆうとがやるのは1〜4の設定を1回だけ。そのあとは毎日 LINE で承認を押すだけ。

---

## 1. Instagram（新しいアカウント）

1. Instagram で新しいアカウントを作る（名前：もしもラボ、アイコン：もしもラボ_プロフィールアイコン.png）
2. 設定 → アカウントの種類とツール → プロアカウントに切り替える → クリエイターを選ぶ
3. https://developers.facebook.com/apps で「アプリを作成」→ 種類は Business を選ぶ
4. アプリのダッシュボードの左メニュー Instagram → API setup with Instagram business login を開く
5. 「アカウントを追加」でもしもラボのアカウントを追加する
   - テスターの招待が出た場合は、Instagram アプリの 設定 → ウェブサイトのアクセス許可 → アプリとウェブサイト → テスターへの招待 で承認する
6. もしもラボの横の Generate token を押して Instagram にログイン → 出てきたトークンをコピー（60日有効。以降はサーバーが30日ごとに自動更新する）
7. 権限は instagram_business_basic と instagram_business_content_publish が付いていればOK
8. IG のユーザーID を調べる：ブラウザで次を開く（TOKEN を貼り替え）
   `https://graph.instagram.com/v25.0/me?fields=user_id,username&access_token=TOKEN`
   → 出てきた user_id を控える

## 2. LINE（通知・承認用の公式アカウント）

1. https://developers.line.biz/console/ でプロバイダーを選び、新しく Messaging API チャネルを作る（名前：もしもラボ通知）
2. チャネル基本設定 の チャネルシークレット を控える
3. Messaging API設定 の チャネルアクセストークン（長期）を発行して控える
4. Messaging API設定 の Webhook URL に `https://あなたのドメイン/moshimo/line/webhook` を入れて、Webhookの利用 をオン
5. LINE Official Account Manager の応答設定で、応答メッセージ（自動応答）をオフ
6. このあとサーバーが動いてから、自分のLINEで公式アカウントを友だち追加して、何か1通送る → 「送り先に登録した」と返ってきたら完了

## 3. VPS（ConoHa）

1. SSH で VPS に入る
2. GitHub の moshimo-lab リポジトリで `server/install.sh` を開いて、右上のコピーボタンで中身をコピー
3. VPS で次を実行して、コピーした中身を貼り付け、最後に Ctrl+D
   ```
   cat > install.sh
   ```
4. `sudo bash install.sh` を実行 → 最後に表示される HOOK_SECRET を控える
5. `sudo nano /etc/moshimo.env` で次を入れて保存
   - BASE_URL=https://あなたのドメイン/moshimo
   - LINE_CHANNEL_SECRET と LINE_CHANNEL_TOKEN（2で控えたもの）
   - IG_USER_ID と IG_TOKEN（1で控えたもの）
6. nginx の HTTPS の server ブロックに、install.sh の最後に出た location /moshimo/ の設定を追記して `sudo nginx -t && sudo nginx -s reload`
7. `sudo systemctl restart moshimo`
8. ブラウザで `https://あなたのドメイン/moshimo/health` を開いて {"ok":true,...} が出ればOK

## 4. GitHub

moshimo-lab リポジトリの Settings → Secrets and variables → Actions → New repository secret で2つ登録

| 名前 | 値 |
|---|---|
| MOSHIMO_BASE_URL | https://あなたのドメイン/moshimo |
| MOSHIMO_SECRET | 3で控えた HOOK_SECRET |

登録したら Actions タブ → daily-render → Run workflow で1回手動で動かしてみる。40〜60分で LINE に承認待ちが届く。

---

## 毎日の操作（LINE）

| ボタン | 動き |
|---|---|
| 承認する | 次に空いている投稿枠（POST_TIMES の時刻）に投稿 |
| 今すぐ投稿 | すぐ投稿 |
| 却下する | 投稿しない。直したいところを Claude に伝える |

LINE で「状態」と送ると、直近の動画の状態が返ってくる。

## 費用

- GitHub Actions：公開リポジトリなので無料・無制限（1日2本にしても0円）
- LINE：無料プラン（月200通）のうち、1日2〜3通で月90通くらい
- Instagram API：無料
- VPS：今の ConoHa 1GB のまま（サーバーのメモリ使用は200MB以下に制限）
