# カバー（表紙）画像 1080x1920 を作る。文字は plan/cover-lines.json（| で改行）、札の色は柱ごと。2026/11/03 ゆうと決定の型
# 使い方: python3 tools/make_covers.py  （先に node tools/render.mjs --video NNNN --stills 2.5 --glonly --outdir out/cover7/NNNN で絵を用意）
import json,glob,os,re
from PIL import Image, ImageDraw, ImageFont
F='/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
TT=json.load(open('plan/cover-lines.json'))
COL={'図星':(226,52,64),'人体の限界':(52,128,230),'絶滅ボタン':(46,170,90),'お財布のもしも':(222,168,30),'ヤバい順':(140,80,220),'全員で同時に':(240,120,40),'社会の消えたら':(214,70,170),'もしもラボ':(40,190,170)}
P={}
for v in '0730 0531 0271 0612 0613 0295 0614 0611 0733 0735 0037'.split(): P[v]='人体の限界'
for v in '0701 0704 0102 0439 0620'.split(): P[v]='絶滅ボタン'
P['0008']='お財布のもしも'
for v in '0736 0723'.split(): P[v]='ヤバい順'
for v in '0069 0103 0622'.split(): P[v]='全員で同時に'
for v in '0029 0009 0038 0621'.split(): P[v]='社会の消えたら'
for v in '0623 0624 0625 0628 0629 0630 0631 0632 0633 0634'.split(): P[v]='図星'
PICK={'0037':'pick/0037/*t040*','0038':'pick/0038/*t014*','0625':'pick/0625/*t014*','0624':'pick/0624/*t030*','0008':'pick/0008/*t048*',
      '0531':'pick2/0531/*t009*','0611':'pick2/0611/*t018*','0613':'pick/0613/*t040*','0614':'pick2/0614/*t018*'}

# 2026/11/03 過去回（YouTube・インスタ用）
for v in '0010 0032 0004 0025'.split(): P[v]='人体の限界'
for v in '0467 0275 0501 0601 0027 0021 0007 0002'.split(): P[v]='絶滅ボタン'
for v in '0534 0016 0028 0033 0022 0602 0003 0034'.split(): P[v]='お財布のもしも'
for v in '0532 0024 0013 0005'.split(): P[v]='全員で同時に'
for v in '0603 0012 0006 0031 0001'.split(): P[v]='社会の消えたら'
P['0035']='ヤバい順'; P['0721']='ヤバい順'; P['0626']=P['0627']='図星'; PICK['0626']='out/cover10/0626/*t026*'; PICK['0627']='out/cover10/0627/*t006*'; PICK['0721']='out/cover10/0721/*t026*'
for v in '0533 0036 0604'.split(): P[v]='もしもラボ'
T10=dict(x.split(':') for x in '0532:036 0533:026 0534:006 0024:046 0036:036 0467:006 0016:026 0010:016 0604:016 0275:006 0028:016 0013:006 0603:016 0012:026 0033:036 0022:006 0602:006 0501:006 0006:054 0601:036 0027:054 0005:046 0032:046 0031:046 0021:006 0004:006 0007:006 0003:006 0035:006 0002:026 0025:046 0001:006 0034:036'.split())
for v,t in T10.items(): PICK[v]=f'out/cover10/{v}/*t{t}*'
SER={'図星':'図星','人体の限界':'人体の限界','絶滅ボタン':'絶滅ボタン','お財布のもしも':'お財布のもしも','ヤバい順':'ヤバい順','全員で同時に':'全員で同時に','社会の消えたら':'社会の消えたら'}
def pillar(v):
  if v in P: return P[v]
  try:
    m=re.search(r"series:\s*['\"]([^'\"]+)",open(f'engine/videos/{v}.js').read())
    if m and m.group(1) in SER: return SER[m.group(1)]
  except Exception: pass
  return 'もしもラボ'
# これからの回：場面の秒数は plan/cover-picks.json（{"0635": 26} のように）。書き出し（tools/build.sh）がその秒の絵を撮ってカバーを作る
PK=json.load(open('plan/cover-picks.json')) if os.path.exists('plan/cover-picks.json') else {}
def font(s): return ImageFont.truetype(F,s,index=0)
BRK='がをにのはでとへ、'
def chunks(t):
  out=[];cur=''
  i=0
  if t.startswith('もしも'): out.append('もしも'); t=t[3:]
  for ch in t:
    cur+=ch
    if ch in BRK: out.append(cur); cur=''
  if cur: out.append(cur)
  return out
def split_long(c,f,maxw):
  # 長すぎる塊は、漢字・カタカナ→ひらがなの切れ目で分ける
  if f.getlength(c)<=maxw: return [c]
  best=None
  for i in range(2,len(c)-1):
    a,b=c[i-1],c[i]
    if (not ('\u3040'<=a<='\u309f')) and ('\u3040'<=b<='\u309f'): continue
    if ('\u3040'<=a<='\u309f') and not ('\u3040'<=b<='\u309f') and b not in 'ー？、': 
      if f.getlength(c[:i])<=maxw: best=i
  if best is None:
    for i in range(len(c)-1,1,-1):
      if f.getlength(c[:i])<=maxw and c[i] not in 'ー？、っゃゅょ': best=i;break
  return [c[:best]]+split_long(c[best:],f,maxw)
def pack(cs,f,maxw):
  parts=[]
  for c in cs: parts+=split_long(c,f,maxw)
  lines=['']
  for c in parts:
    if f.getlength(lines[-1]+c)<=maxw: lines[-1]+=c
    else: lines.append(c)
  return lines
def layout(t,maxw=960):
  cs=chunks(t); best={}
  for size in range(164,96,-4):
    lines=pack(cs,font(size),maxw)
    n=len(lines)
    if n not in best: best[n]=(size,lines)
  c3=max((best[n] for n in best if n<=3), key=lambda x:x[0], default=None)
  c4=best.get(4)
  if c3 and (not c4 or c3[0]>=c4[0]-16): return c3
  return c4 or c3
SRC=None
def make(v):
  lines=json.load(open('plan/cover-lines.json'))[v].split('|')
  size=164 if len(lines)<4 else 140
  while max(font(size).getlength(x) for x in lines)>960: size-=4
  srcp=SRC or (glob.glob((PICK[v] if PICK[v].startswith('out/') else 'out/cover7/'+PICK[v])+'.jpg')[0] if v in PICK else (glob.glob(f'out/cover/{v}/*.jpg') or glob.glob(f'out/cover7/{v}/*.jpg'))[0])
  top=478+len(lines)*(size+12)
  off=max(380,top-430)+{'0629':-180,'0634':60}.get(v,0)
  src=Image.open(srcp).convert('RGB').resize((1080,1920))
  bg=Image.new('RGB',(1080,1920),(12,12,22)); bg.paste(src.crop((0,0,1080,1920-off)),(0,off))
  grad=Image.new('L',(1080,1920),0); gd=ImageDraw.Draw(grad)
  for y in range(1920): gd.line([(0,y),(1080,y)],fill=int(255*max(0,min(1,(top+70-y)/230))))
  bg=Image.composite(Image.new('RGB',(1080,1920),(12,12,22)),bg,grad); d=ImageDraw.Draw(bg)
  name=pillar(v); f=font(68); w=d.textlength(name,font=f)
  d.rounded_rectangle([540-w/2-48,330,540+w/2+48,446],radius=58,fill=COL[name]); d.text((540,386),name,font=f,fill=(255,255,255),anchor='mm')
  y=478
  for i,s in enumerate(lines):
    d.text((540,y+size*0.5),s,font=font(size),fill=(255,214,70) if i==len(lines)-1 else (255,255,255),anchor='mm',stroke_width=14,stroke_fill=(0,0,0)); y+=size+12
  return bg,lines,size
os.makedirs('out/cover9',exist_ok=True)
import sys
if len(sys.argv)>1 and sys.argv[1]=='--one':
  # 書き出し用：python3 tools/make_covers.py --one NNNN 絵.jpg 出力.jpg
  SRC=sys.argv[3]; im,l,sz=make(sys.argv[2]); im.save(sys.argv[4],quality=92,comment=b'moshimo-cover'); print('cover',sys.argv[2],sz,l); sys.exit(0)
for v in (sys.argv[1:] or TT):
  im,l,s=make(v); im.save(f'out/cover9/{v}_cover.jpg',quality=95,comment=b'moshimo-cover'); print(v,s,l)
ims=sorted(glob.glob('out/cover9/*_cover.jpg'))
S=Image.new('RGB',(180*7,240*5),'white')
for i,f in enumerate(ims): S.paste(Image.open(f).crop((0,240,1080,1680)).resize((180,240)),((i%7)*180,(i//7)*240))
S.save('out/cover9/grid.jpg')
