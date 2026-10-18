#!/usr/bin/env bash
# nginx の HTTPS サイト設定に location /moshimo/ を1回だけ追加する
#   sudo bash add-nginx.sh /etc/nginx/sites-enabled/ai-office
# 追加前にバックアップを取り、nginx -t が通らなければ元に戻す。
set -euo pipefail
CONF=$(readlink -f "${1:?nginx の設定ファイルを指定して}")
if grep -q "location /moshimo/" "$CONF"; then echo "もう追加済み"; exit 0; fi
grep -q "listen 443 ssl" "$CONF" || { echo "HTTPS（listen 443 ssl）の行が見つからへん：$CONF"; exit 1; }
BK="/root/$(basename "$CONF").bak-moshimo-$(date +%Y%m%d%H%M%S)"
cp "$CONF" "$BK"
python3 - "$CONF" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read()
block = """    location /moshimo/ {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 300m;
        proxy_request_buffering off;
        proxy_read_timeout 300s;
    }

"""
i = s.index("listen 443 ssl")
i = s.rfind("\n", 0, i) + 1
s = s[:i] + block + s[i:]
open(p, "w").write(s)
PY
if nginx -t; then
  systemctl reload nginx
  echo "nginx に /moshimo/ を追加した（バックアップ：$BK）"
else
  cp "$BK" "$CONF"
  echo "nginx の設定チェックに失敗したので元に戻した"
  exit 1
fi
