#!/usr/bin/env bash
# ニュースアカウント（インスタのみ・完全自動）の投稿サーバーのインストール（ConoHa VPS で sudo bash install-news.sh）
# もしもラボ・クイズ・いつわ劇場・SNS司令室のサーバーには触らない。何度実行しても大丈夫。/etc/news.env が既にあれば上書きしない
set -euo pipefail
if [ "$(id -u)" != 0 ]; then echo "sudo bash install-news.sh で実行して"; exit 1; fi
NODE_BIN=$(command -v node || true)
if [ -z "$NODE_BIN" ]; then echo "Node.js がない。先にもしもラボの install.sh を実行して"; exit 1; fi
REF="${1:-main}"

mkdir -p /opt/news
curl -fsSL "https://raw.githubusercontent.com/oishi-thomaz/moshimo-lab/$REF/server/news-server.mjs" -o /opt/news/server.new.mjs
"$NODE_BIN" --check /opt/news/server.new.mjs
mv /opt/news/server.new.mjs /opt/news/server.mjs

cat > /etc/systemd/system/news.service <<EOF
[Unit]
Description=news account posting server (instagram only)
After=network-online.target

[Service]
EnvironmentFile=/etc/news.env
ExecStart=$NODE_BIN /opt/news/server.mjs
Restart=always
RestartSec=5
User=www-data
Group=www-data
StateDirectory=news
MemoryMax=150M

[Install]
WantedBy=multi-user.target
EOF

if [ ! -f /etc/news.env ]; then
  curl -fsSL "https://raw.githubusercontent.com/oishi-thomaz/moshimo-lab/$REF/server/news.env.example" -o /etc/news.env
  SECRET="$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 40)"
  sed -i "s#^HOOK_SECRET=.*#HOOK_SECRET=$SECRET#" /etc/news.env
  MB=$(grep -E '^BASE_URL=' /etc/moshimo.env 2>/dev/null | head -1 | cut -d= -f2- || true)
  if [ -n "$MB" ]; then sed -i "s#^BASE_URL=.*#BASE_URL=${MB%/moshimo}/news#" /etc/news.env; fi
  # 失敗の知らせは SNS司令室の LINE に送る（同じトークンを使う）
  ST=$(grep -E '^LINE_CHANNEL_TOKEN=' /etc/sns.env 2>/dev/null | head -1 | cut -d= -f2- || true)
  if [ -n "$ST" ]; then sed -i "s#^ALERT_LINE_TOKEN=.*#ALERT_LINE_TOKEN=$ST#" /etc/news.env; fi
  chmod 600 /etc/news.env
fi

# nginx：もしもラボの location /moshimo/ がある設定ファイルに、location /news/ を1回だけ足す（失敗したら元に戻す）
CONF=$(grep -l "location /moshimo/" /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf 2>/dev/null | head -1 || true)
if [ -n "$CONF" ] && ! grep -q "location /news/" "$CONF"; then
  CONF=$(readlink -f "$CONF"); BK="/root/$(basename "$CONF").bak-news-$(date +%Y%m%d%H%M%S)"; cp "$CONF" "$BK"
  python3 - "$CONF" <<'PY'
import sys
p = sys.argv[1]; s = open(p).read()
block = """    location /news/ {
        proxy_pass http://127.0.0.1:8791;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 20m;
        proxy_read_timeout 300s;
    }

"""
i = s.index("location /moshimo/"); i = s.rfind("\n", 0, i) + 1
open(p, "w").write(s[:i] + block + s[i:])
PY
  if nginx -t 2>/dev/null; then systemctl reload nginx; echo "nginx に /news/ を追加した（バックアップ：$BK）"; else cp "$BK" "$CONF"; echo "nginx の設定チェックに失敗したので元に戻した。Claude に伝えて"; fi
fi

systemctl daemon-reload
systemctl enable --now news
systemctl restart news
sleep 1
curl -fsS http://127.0.0.1:8791/news/health && echo && echo "ニュースの投稿サーバーは動いてる"
echo
echo "=== 控えておくもの（GitHub の Secrets に入れる） ==="
echo "NEWS_SECRET: $(grep -E '^HOOK_SECRET=' /etc/news.env | cut -d= -f2-)"
echo "NEWS_BASE_URL: $(grep -E '^BASE_URL=' /etc/news.env | cut -d= -f2-)"
if ! grep -qE '^IG_TOKEN=.+' /etc/news.env; then
  echo
  echo "次：sudo nano /etc/news.env で IG_USER_ID と IG_TOKEN を入れて保存 → sudo systemctl restart news"
fi
