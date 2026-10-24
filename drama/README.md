# いつわ劇場（5話完結のショートドラマ）

もしもラボとは別のドラマ用の仕組み。もしもラボの毎日の書き出し・投稿には一切つながっていない。

## 1話の作り方
1. 台本 `drama/episodes/<作品>/epNN.script.js`（CAST＝役と声、LINES＝1行1声。beat は声のない間）
2. 映像 `drama/episodes/<作品>/epNN.shots.js`（SHOTS＝行のIDから始まるショット、SFX、MUSIC、CHIPS）
3. 声：GitHub Actions の drama-tts を手動実行（script と name を指定）→ `drama-tts` ブランチの `tts/<name>/` に入る
4. 手元で `git archive origin/drama-tts tts/<name> | tar -x` してから
   `bash drama/tools/build.sh <作品>/epNN tts/<name> out/drama/<name>` → `out/drama/<name>.mp4`
5. 静止画の確認：`node drama/tools/render.mjs --ep <作品>/epNN --tts tts/<name>/index.json --stills shots --outdir out/drama/stills`

## 決めごと
- 1話は178.5秒以内（YouTubeショート・インスタの3分に収める）。長いときは声を最大1.08倍まで速め、間を詰める。それでも長ければ台本を削る
- 字幕は画面中央より少し下（y=1262）に固定。人物の顔はそれより上に置く
- 効果音・BGMは drama/tools/audio.py で全部合成（著作権フリー）
- 声の読み間違いは read で直す（例：便器→べんき）。書き出し前に文字起こしで全行チェックする
