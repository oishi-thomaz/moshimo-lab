#!/usr/bin/env python3
"""Generates server/install.sh: one file to paste on the VPS. It embeds the server code, so the VPS needs no access to this private repo."""
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent
server = (root / 'server/moshimo-server.mjs').read_text()
service = (root / 'server/moshimo.service').read_text()
envex = (root / 'server/moshimo.env.example').read_text()
nginx = (root / 'server/nginx-moshimo.conf').read_text()
assert 'MOSHIMO_EOF' not in server
script = f'''#!/usr/bin/env bash
# もしもラボ 投稿サーバーのインストール（ConoHa VPS で sudo bash install.sh https://ドメイン/moshimo [合言葉]）
# 何度実行しても大丈夫。/etc/moshimo.env が既にあれば上書きしない。
set -euo pipefail
if [ "$(id -u)" != 0 ]; then echo "sudo bash install.sh で実行して"; exit 1; fi

# Node.js 18以上
NODE_OK=0
if command -v node >/dev/null; then v=$(node -p 'process.versions.node.split(".")[0]'); [ "$v" -ge 18 ] && NODE_OK=1; fi
if [ $NODE_OK = 0 ]; then
  echo "Node.js 22 を入れる"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
NODE_BIN=$(command -v node)

mkdir -p /opt/moshimo-lab/server
cat > /opt/moshimo-lab/server/moshimo-server.mjs <<'MOSHIMO_EOF'
{server}MOSHIMO_EOF

cat > /etc/systemd/system/moshimo.service <<'MOSHIMO_EOF'
{service}MOSHIMO_EOF
sed -i "s#/usr/bin/node#$NODE_BIN#" /etc/systemd/system/moshimo.service

if [ ! -f /etc/moshimo.env ]; then
cat > /etc/moshimo.env <<'MOSHIMO_EOF'
{envex}MOSHIMO_EOF
  SECRET="${{2:-$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 40)}}"
  sed -i "s#^HOOK_SECRET=.*#HOOK_SECRET=$SECRET#" /etc/moshimo.env
  if [ -n "${{1:-}}" ]; then sed -i "s#^BASE_URL=.*#BASE_URL=$1#" /etc/moshimo.env; fi
  chmod 600 /etc/moshimo.env
  echo
  echo "HOOK_SECRET（GitHubのSecretsにも同じ値を入れる）: $SECRET"
fi

systemctl daemon-reload
systemctl enable --now moshimo
systemctl restart moshimo
sleep 1
curl -fsS http://127.0.0.1:8787/moshimo/health && echo && echo "サーバーは動いてる"
echo
echo "nginx を使ってる場合は、HTTPSの server ブロックに次を追記して nginx -s reload："
cat <<'MOSHIMO_EOF'
{nginx}MOSHIMO_EOF
'''
(root / 'server/install.sh').write_text(script)
print('wrote server/install.sh', len(script))

# いつわ劇場用（もしもラボのサーバーには触らない。同じプログラムを /opt/itsuwa に置いて、別のサービス・別のURLで動かす）
iservice = (root / 'server/itsuwa.service').read_text()
ienv = (root / 'server/itsuwa.env.example').read_text()
iscript = f'''#!/usr/bin/env bash
# いつわ劇場 投稿サーバーのインストール（ConoHa VPS で sudo bash install-itsuwa.sh）
# もしもラボのサーバー（moshimo）には触らない。何度実行しても大丈夫。/etc/itsuwa.env が既にあれば上書きしない。
set -euo pipefail
if [ "$(id -u)" != 0 ]; then echo "sudo bash install-itsuwa.sh で実行して"; exit 1; fi
NODE_BIN=$(command -v node || true)
if [ -z "$NODE_BIN" ]; then echo "Node.js がない。先にもしもラボの install.sh を実行して"; exit 1; fi

mkdir -p /opt/itsuwa
cat > /opt/itsuwa/server.mjs <<'MOSHIMO_EOF'
{server}MOSHIMO_EOF

cat > /etc/systemd/system/itsuwa.service <<'MOSHIMO_EOF'
{iservice}MOSHIMO_EOF
sed -i "s#/usr/bin/node#$NODE_BIN#" /etc/systemd/system/itsuwa.service

if [ ! -f /etc/itsuwa.env ]; then
cat > /etc/itsuwa.env <<'MOSHIMO_EOF'
{ienv}MOSHIMO_EOF
  SECRET="$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 40)"
  sed -i "s#^HOOK_SECRET=.*#HOOK_SECRET=$SECRET#" /etc/itsuwa.env
  # もしもラボと同じドメインを使う
  MB=$(grep -E '^BASE_URL=' /etc/moshimo.env 2>/dev/null | head -1 | cut -d= -f2- || true)
  if [ -n "$MB" ]; then sed -i "s#^BASE_URL=.*#BASE_URL=${{MB%/moshimo}}/itsuwa#" /etc/itsuwa.env; fi
  chmod 600 /etc/itsuwa.env
fi

# nginx：もしもラボの location /moshimo/ がある設定ファイルに、location /itsuwa/ を1回だけ足す（失敗したら元に戻す）
CONF=$(grep -l "location /moshimo/" /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf 2>/dev/null | head -1 || true)
if [ -n "$CONF" ] && ! grep -q "location /itsuwa/" "$CONF"; then
  CONF=$(readlink -f "$CONF"); BK="/root/$(basename "$CONF").bak-itsuwa-$(date +%Y%m%d%H%M%S)"; cp "$CONF" "$BK"
  python3 - "$CONF" <<'PY'
import sys
p = sys.argv[1]; s = open(p).read()
block = """    location /itsuwa/ {{
        proxy_pass http://127.0.0.1:8788;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 300m;
        proxy_request_buffering off;
        proxy_read_timeout 300s;
    }}

"""
i = s.index("location /moshimo/"); i = s.rfind("\\n", 0, i) + 1
open(p, "w").write(s[:i] + block + s[i:])
PY
  if nginx -t 2>/dev/null; then systemctl reload nginx; echo "nginx に /itsuwa/ を追加した（バックアップ：$BK）"; else cp "$BK" "$CONF"; echo "nginx の設定チェックに失敗したので元に戻した。Claude に伝えて"; fi
fi

systemctl daemon-reload
systemctl enable --now itsuwa
systemctl restart itsuwa
sleep 1
curl -fsS http://127.0.0.1:8788/itsuwa/health && echo && echo "いつわ劇場のサーバーは動いてる"
BASE=$(grep -E '^BASE_URL=' /etc/itsuwa.env | cut -d= -f2-)
echo
echo "=== 控えておくもの ==="
echo "HOOK_SECRET（GitHub の ITSUWA_SECRET）: $(grep -E '^HOOK_SECRET=' /etc/itsuwa.env | cut -d= -f2-)"
echo "ITSUWA_BASE_URL: $BASE"
echo "LINE の Webhook URL: $BASE/line/webhook"
echo "TikTok のリダイレクトURI: $BASE/tt/callback"
echo "YouTube のリダイレクトURI: $BASE/yt/callback"
'''
(root / 'server/install-itsuwa.sh').write_text(iscript)
print('wrote server/install-itsuwa.sh', len(iscript))
