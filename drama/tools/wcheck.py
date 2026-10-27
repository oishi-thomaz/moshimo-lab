import json,subprocess,sys,numpy as np
from faster_whisper import WhisperModel
d=sys.argv[1]; idx=json.load(open(d+'/index.json'))
m=WhisperModel('medium',device='cpu',compute_type='int8')
out={}
for k,v in idx.items():
    a=subprocess.run(['ffmpeg','-v','error','-i',f'{d}/{k}.wav','-f','s16le','-ac','1','-ar','16000','-'],capture_output=True).stdout
    x=np.frombuffer(a,np.int16).astype(np.float32)/32768
    segs,_=m.transcribe(x,language='ja',beam_size=5,initial_prompt=(sys.argv[3] if len(sys.argv)>3 else '大阪弁のドラマ。ユウマ、坂口、ジン、カラス、オカン、オトン、ミク。'))
    t=''.join(s.text for s in segs); out[k]=t
    print(f"{k:4} {v['dur']:5.2f} | {v['text']}\n          > {t}",flush=True)
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False)
