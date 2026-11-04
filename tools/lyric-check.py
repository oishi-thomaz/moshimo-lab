# 曲のクイズ：動画の文（字幕・札・キャプション・カバーの文字）と歌詞が重なっていないかを確かめる（docs/QUIZ.md の 曲のクイズ）
#   curl -sS -A "Mozilla/5.0" https://j-lyric.net/artist/xxxx/yyyy.html | python3 -I tools/lyric-check.py qNNN
# 歌詞は標準入力から読むだけで、ファイルに保存しない・画面に出さない。出すのは「重なる言葉」（動画の文の側の文字列）だけ。
# 重なりが曲名（答えの行）と文法の切れ端（なかった・を見 など）だけになるまで文を直す。意味が歌詞の1行の言い換えに見える文も直す（これは目で見る）
# j-lyric.net（id="Lyric"）・うたてん（class="hiragana"、ふりがなは外す）・オリコン（class="all-lyrics"）のページに対応
import html, json, re, sys

qid = sys.argv[1]
raw = sys.stdin.buffer.read()
page = None
for enc in ('utf-8', 'cp932'):
  try: page = raw.decode(enc); break
  except UnicodeDecodeError: pass
page = re.sub(r'<span class="rt">.*?</span>', '', page or '')
m = (re.search(r'class="hiragana"[^>]*>(.*?)</div>', page, re.S) or re.search(r'class="all-lyrics"[^>]*>(.*?)</div>', page, re.S)
     or re.search(r'id="Lyric"[^>]*>(.*?)</p>', page, re.S))
if not m: print('歌詞が見つからない（ページの形が違う）'); sys.exit(1)
lyr = re.sub(r'\s+', '', html.unescape(re.sub(r'<[^>]+>', '', m.group(1))))
print('歌詞の文字数:', len(lyr))

src = open(f'engine/videos/{qid}.js', encoding='utf-8').read()
src = re.sub(r'narr: \{.*?\},', '', src, flags=re.S)
src = '\n'.join(l for l in src.splitlines() if not l.strip().startswith('//'))
texts = [x.replace('<br>', '').replace('\\n', '\n') for x in re.findall(r"'([^'\n]*[぀-ヿ一-鿿][^'\n]*)'", src)]
try: texts.append(json.load(open('plan/quiz-covers.json', encoding='utf-8'))[qid]['text'].replace('|', ''))
except (KeyError, FileNotFoundError): pass

ok = re.compile(r'[一-鿿゠-ヿA-Za-z]')
hits = set()
for line in '\n'.join(texts).splitlines():
  s = re.sub(r'[\s、。，．！？!?「」…・]', '', line)
  for i in range(len(s)):
    for j in range(len(s), i + 1, -1):
      w = s[i:j]
      if ((len(w) >= 2 and ok.search(w)) or len(w) >= 4) and w in lyr: hits.add(w); break
res = sorted([h for h in hits if not any(h != o and h in o for o in hits)], key=len, reverse=True)
print('重なる言葉:', ' / '.join(res) if res else 'なし')
