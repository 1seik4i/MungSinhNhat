"""Retrieve reference metadata; raw extracts remain local under .reference."""
from concurrent.futures import ThreadPoolExecutor
from html import unescape
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
import json
import re

DIGITS = '零一二三四五六七八九'
def chinese(n):
    if n == 100: return '一百'
    if n < 10: return DIGITS[n]
    return (DIGITS[n//10] if n >= 20 else '') + '十' + (DIGITS[n%10] if n%10 else '')

def read(n):
    url = 'https://www.ctc.org.hk/chim/' + quote('觀音籤-第' + chinese(n) + '籤') + '/'
    body = urlopen(Request(url, headers={'User-Agent':'Mozilla/5.0'}), timeout=35).read().decode('utf-8')
    Path('.reference/fortune-sample.html').write_text(body,encoding='utf-8') if n==1 else None
    headerHtml=body.split('txt-grp txt-grp1',1)[1].split('txt-grp txt-grp2',1)[0]
    header=unescape(re.sub('<[^>]+>',' ',headerHtml))
    match=re.search(r'第(.+?)籤\s*([上中下]籤)\s*古人\s*(\S+)',header,re.S)
    poemHtml=body.split('txt-grp txt-grp2',1)[1].split('txt-grp txt-grp3',1)[0]
    poemHtml=poemHtml.split('>',1)[1]
    body=re.sub(r'</(?:p|div|h[1-6]|li)>|<br\s*/?>','\n',poemHtml)
    text = unescape(re.sub('<[^>]+>', '', body))
    lines = [re.sub(r'\s+', ' ', line).strip() for line in text.splitlines() if line.strip()]
    if not match: raise ValueError((n,header))
    return {'number':n,'titleOriginal':match[3],'gradeOriginal':match[2], 'sourceUrl':url, 'referenceLines':lines}

if __name__ == '__main__':
    with ThreadPoolExecutor(max_workers=4) as pool: records=list(pool.map(read,range(1,101)))
    destination=Path('.reference/fortune-sources.json')
    destination.parent.mkdir(exist_ok=True)
    destination.write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Validated',len(records),'source pages; reference saved locally.')
