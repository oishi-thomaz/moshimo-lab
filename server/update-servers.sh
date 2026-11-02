#!/usr/bin/env bash
# 投稿サーバー3つ（もしもラボ・クイズ・いつわ劇場）と SNS司令室の返事係を、このリポジトリの指定のコミットの中身に入れ替えて、リッチメニューも入れ直す
#   sudo bash update-servers.sh <コミット>
# 設定（/etc/*.env）と記録（/var/lib/*）には触らない。入れ替える前のファイルは /root/server-backup-日時/ に残す
set -euo pipefail
if [ "$(id -u)" != 0 ]; then echo "sudo bash update-servers.sh <コミット> で実行して"; exit 1; fi
REF="${1:?コミットを指定して}"
RAW="https://raw.githubusercontent.com/oishi-thomaz/moshimo-lab/$REF/server"
TMP=$(mktemp -d)
curl -fsSL "$RAW/moshimo-server.mjs" -o "$TMP/moshimo-server.mjs"
curl -fsSL "$RAW/sns-server.mjs" -o "$TMP/sns-server.mjs"
curl -fsSL "$RAW/setup-richmenu.mjs" -o "$TMP/setup-richmenu.mjs"
node --check "$TMP/moshimo-server.mjs" && node --check "$TMP/sns-server.mjs"

BK="/root/server-backup-$(date +%Y%m%d%H%M%S)"; mkdir -p "$BK"
# 2026/11/02〜：承認と通知は SNS司令室にまとめる（各アカウントの LINE から自分では送らない）。クイズの TikTok は下書き送り
setenv() { local f=$1 k=$2 v=$3; [ -f "$f" ] || return 0; cp "$f" "$BK/$(basename "$f")"; if grep -q "^$k=" "$f"; then sed -i "s/^$k=.*/$k=$v/" "$f"; else echo "$k=$v" >> "$f"; fi; }
setenv /etc/moshimo.env QUIET 1
setenv /etc/quiz.env QUIET 1
setenv /etc/itsuwa.env QUIET 1
setenv /etc/quiz.env TT_UPLOAD 1
put() { local src=$1 dst=$2 svc=$3; [ -f "$dst" ] || { echo "× $dst がない（$svc は飛ばす）"; return; }; cp "$dst" "$BK/$svc.mjs"; cp "$src" "$dst"; systemctl restart "$svc"; echo "○ $svc を入れ替えた"; }
put "$TMP/moshimo-server.mjs" /opt/moshimo-lab/server/moshimo-server.mjs moshimo
put "$TMP/moshimo-server.mjs" /opt/quiz/server.mjs quiz
put "$TMP/moshimo-server.mjs" /opt/itsuwa/server.mjs itsuwa
put "$TMP/sns-server.mjs" /opt/sns/server.mjs sns
sleep 2
for s in moshimo quiz itsuwa sns; do printf '%s: ' "$s"; systemctl is-active "$s"; done
node "$TMP/setup-richmenu.mjs" "$REF"
echo "前のファイルは $BK にある"
