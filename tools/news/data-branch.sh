#!/usr/bin/env bash
# news-data ブランチ（ニュースの候補・Claude が書いた投稿・送った記録）を <フォルダ> に用意する。なければ作る
set -euo pipefail
DIR="${1:-news-data}"
URL="https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY:-oishi-thomaz/moshimo-lab}.git"
if git ls-remote --exit-code --heads "$URL" news-data >/dev/null 2>&1; then
  git clone -q --depth 20 -b news-data "$URL" "$DIR"
else
  mkdir -p "$DIR" && cd "$DIR" && git init -q -b news-data && git remote add origin "$URL"
  mkdir -p queue failed && touch queue/.keep failed/.keep done.txt
  printf '# news-data\nニュースアカウントの作業用ブランチ（main とは別）。candidates.json＝候補、queue/＝Claude が書いた投稿、done.txt＝送った記録、failed/＝写真が取れなかった回。docs/NEWS.md\n' > README.md
  git add -A && git -c user.name='github-actions[bot]' -c user.email='41898282+github-actions[bot]@users.noreply.github.com' commit -q -m "news-data を作った"
  git push -q origin HEAD:news-data
fi
