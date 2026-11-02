#!/usr/bin/env bash
# SNS司令室（まとめ用の LINE 公式アカウント）の返事係のインストール（ConoHa VPS で sudo bash install-sns.sh）
# もしもラボ・クイズ・いつわ劇場のサーバーには触らない（記録を読むだけ）。何度実行しても大丈夫。/etc/sns.env が既にあれば上書きしない。
set -euo pipefail
if [ "$(id -u)" != 0 ]; then echo "sudo bash install-sns.sh で実行して"; exit 1; fi
NODE_BIN=$(command -v node || true)
if [ -z "$NODE_BIN" ]; then echo "Node.js がない。先にもしもラボの install.sh を実行して"; exit 1; fi

mkdir -p /opt/sns
curl -fsSL https://raw.githubusercontent.com/oishi-thomaz/moshimo-lab/main/server/sns-server.mjs -o /opt/sns/server.mjs

cat > /etc/systemd/system/sns.service <<EOF
[Unit]
Description=SNS shireishitsu LINE replies
After=network-online.target

[Service]
EnvironmentFile=/etc/sns.env
ExecStart=$NODE_BIN /opt/sns/server.mjs
Restart=always
RestartSec=5
User=www-data
Group=www-data
StateDirectory=sns
MemoryMax=120M

[Install]
WantedBy=multi-user.target
EOF

if [ ! -f /etc/sns.env ]; then
cat > /etc/sns.env <<'EOF'
# SNS司令室の返事係の設定（/etc/sns.env。chmod 600）
PORT=8790
PREFIX=/sns
DATA_DIR=/var/lib/sns
# LINE Developers の SNS司令室の Messaging API チャネル
#   チャネルシークレット：チャネル基本設定 の一番下
#   チャネルアクセストークン：Messaging API設定 の一番下（GitHub に登録したのと同じ長期トークン）
LINE_CHANNEL_SECRET=
LINE_CHANNEL_TOKEN=
# 空でOK。SNS司令室に何か送ると、自動でゆうとのIDが登録される（ほかの人には返事しない）
LINE_OWNER_USER_ID=
EOF
  chmod 600 /etc/sns.env
fi

# nginx：もしもラボの location /moshimo/ がある設定ファイルに、location /sns/ を1回だけ足す（失敗したら元に戻す）
CONF=$(grep -l "location /moshimo/" /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf 2>/dev/null | head -1 || true)
if [ -n "$CONF" ] && ! grep -q "location /sns/" "$CONF"; then
  CONF=$(readlink -f "$CONF"); BK="/root/$(basename "$CONF").bak-sns-$(date +%Y%m%d%H%M%S)"; cp "$CONF" "$BK"
  python3 - "$CONF" <<'PY'
import sys
p = sys.argv[1]; s = open(p).read()
block = """    location /sns/ {
        proxy_pass http://127.0.0.1:8790;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
    }

"""
i = s.index("location /moshimo/"); i = s.rfind("\n", 0, i) + 1
open(p, "w").write(s[:i] + block + s[i:])
PY
  if nginx -t 2>/dev/null; then systemctl reload nginx; echo "nginx に /sns/ を追加した（バックアップ：$BK）"; else cp "$BK" "$CONF"; echo "nginx の設定チェックに失敗したので元に戻した。Claude に伝えて"; fi
fi

systemctl daemon-reload
systemctl enable --now sns
systemctl restart sns
sleep 1
curl -fsS http://127.0.0.1:8790/sns/health && echo && echo "SNS司令室の返事係は動いてる"
MB=$(grep -E '^BASE_URL=' /etc/moshimo.env 2>/dev/null | head -1 | cut -d= -f2- || true)
echo
echo "=== 次にやること ==="
if ! grep -qE '^LINE_CHANNEL_SECRET=.+' /etc/sns.env; then
  echo "1. sudo nano /etc/sns.env で LINE_CHANNEL_SECRET と LINE_CHANNEL_TOKEN を入れて保存 → sudo systemctl restart sns"
fi
echo "2. LINE Developers の SNS司令室 → Messaging API設定 → Webhook URL に次を入れて 検証 → Webhookの利用 をオン"
echo "   ${MB%/moshimo}/sns/line/webhook"
echo "3. LINE Official Account Manager の 応答設定 で 応答メッセージ をオフ（自動返信が邪魔するため）"
echo "4. SNS司令室に ストック と送る"
