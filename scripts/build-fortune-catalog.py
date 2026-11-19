from pathlib import Path
import json

references=json.loads(Path('.reference/fortune-sources.json').read_text(encoding='utf-8'))
interpretations=Path('shared/fortune-interpretations.txt').read_text(encoding='utf-8').splitlines()
assert len(references)==len(interpretations)==100
grades={'上籤':'Thượng quẻ','中籤':'Trung quẻ','下籤':'Hạ quẻ'}
records=[]
for source,line in zip(references,interpretations):
    title,meaning=line.split('|',1)
    records.append({'id':f'ctc-guanyin-{source["number"]:03d}','number':source['number'],'title':f'Quẻ {source["number"]:03d} · {title}', 'titleOriginal':source['titleOriginal'],'grade':grades[source['gradeOriginal']],'gradeOriginal':source['gradeOriginal'],'fortune':meaning,'sourceUrl':source['sourceUrl'],'sourceName':'Chinese Temples Committee · 觀音籤','interpretationLabel':'Diễn giải tiếng Việt của ứng dụng','catalogVersion':'ctc-guanyin-100-v1'})
Path('shared/data').mkdir(exist_ok=True)
Path('shared/data/guanyin100.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Built 100 distinct, sourced fortune records.')
