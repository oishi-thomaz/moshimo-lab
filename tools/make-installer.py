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
# もしもラボ 投稿サーバーのインストール（ConoHa VPS で sudo bash install.sh）
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
  SECRET=$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 40)
  sed -i "s#^HOOK_SECRET=.*#HOOK_SECRET=$SECRET#" /etc/moshimo.env
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
