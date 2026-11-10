# もしもラボのカルーセル：投稿サーバーに送る説明（<番号>.json）を作る。番号＝8000＋動画の番号（0635 → 8635）
#   python3 tools/carousel_meta.py plan/carousel/0635.json out/0635.json out/carousel/0635
# キャプションは動画のキャプションを元に、1行目をめくる案内つきの形にする（plan の caption があればそれを使う）
import json, os, sys
plan = json.load(open(sys.argv[1])); vm = json.load(open(sys.argv[2])); out = sys.argv[3]
vid = plan['id']; cid = f'{8000 + int(vid):04d}'
slides = sorted(f for f in os.listdir(out) if f[:2].isdigit() and f.endswith('.jpg'))
title = ''.join(plan['title'])
cap = plan.get('caption') or f"{(vm.get('caption') or title).strip()}\n\n📌 保存して、あとで友だちにも聞いてみて"
meta = {'id': cid, 'type': 'carousel', 'video': vid, 'title': f'{title}（カルーセル）', 'slides': len(slides), 'caption': cap.strip(),
        'hashtags': vm.get('hashtags') or ['もしもラボ', 'もしも'], 'ask': plan['end'].get('ask', '').replace('|', ''), 'series': plan.get('series', ''), 'sources': vm.get('sources', '')}
json.dump(meta, open(os.path.join(out, f'{cid}.json'), 'w'), ensure_ascii=False, indent=1)
print(cid, len(slides), '枚')
