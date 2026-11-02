# カバー（表紙）画像 1080x1920 を作る。文字は plan/cover-lines.json（| で改行）、札の色は柱ごと。2026/11/03 ゆうと決定の型
# 使い方: python3 tools/make_covers.py  （先に node tools/render.mjs --video NNNN --stills 2.5 --glonly --outdir out/cover7/NNNN で絵を用意）
import json,glob,os,re
from PIL import Image, ImageDraw, ImageFont
F='/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
TT=json.load(open('plan/cover-lines.json'))
COL={'図星':(226,52,64),'人体の限界':(52,128,230),'絶滅ボタン':(46,170,90),'お財布のもしも':(222,168,30),'ヤバい順':(140,80,220),'全員で同時に':(240,120,40),'社会の消えたら':(214,70,170)}
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
def make(v):
  lines=json.load(open('plan/cover-lines.json'))[v].split('|')
  size=164 if len(lines)<4 else 140
  while max(font(size).getlength(x) for x in lines)>960: size-=4
  srcp=glob.glob('out/cover7/'+PICK[v]+'.jpg')[0] if v in PICK else (glob.glob(f'out/cover/{v}/*.jpg') or glob.glob(f'out/cover7/{v}/*.jpg'))[0]
  top=478+len(lines)*(size+12)
  off=max(380,top-430)+{'0629':-180,'0634':60}.get(v,0)
  src=Image.open(srcp).convert('RGB').resize((1080,1920))
  bg=Image.new('RGB',(1080,1920),(12,12,22)); bg.paste(src.crop((0,0,1080,1920-off)),(0,off))
  grad=Image.new('L',(1080,1920),0); gd=ImageDraw.Draw(grad)
  for y in range(1920): gd.line([(0,y),(1080,y)],fill=int(255*max(0,min(1,(top+70-y)/230))))
  bg=Image.composite(Image.new('RGB',(1080,1920),(12,12,22)),bg,grad); d=ImageDraw.Draw(bg)
  name=P[v]; f=font(68); w=d.textlength(name,font=f)
  d.rounded_rectangle([540-w/2-48,330,540+w/2+48,446],radius=58,fill=COL[name]); d.text((540,386),name,font=f,fill=(255,255,255),anchor='mm')
  y=478
  for i,s in enumerate(lines):
    d.text((540,y+size*0.5),s,font=font(size),fill=(255,214,70) if i==len(lines)-1 else (255,255,255),anchor='mm',stroke_width=14,stroke_fill=(0,0,0)); y+=size+12
  return bg,lines,size
os.makedirs('out/cover9',exist_ok=True)
for v in TT:
  im,l,s=make(v); im.save(f'out/cover9/{v}_cover.jpg',quality=95); print(v,s,l)
ims=sorted(glob.glob('out/cover9/*_cover.jpg'))
S=Image.new('RGB',(180*7,240*5),'white')
for i,f in enumerate(ims): S.paste(Image.open(f).crop((0,240,1080,1680)).resize((180,240)),((i%7)*180,(i//7)*240))
S.save('out/cover9/grid.jpg')
