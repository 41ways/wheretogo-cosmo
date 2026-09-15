# 도감 설명(build/dex.json)과 사진 출처(build/images.json)를 화면용 data/dex.json 하나로
import json, os
dex = json.load(open('build/dex.json'))
img = json.load(open('build/images.json')) if os.path.exists('build/images.json') else {}
img = {k: {'file': v['file'], 'artist': v.get('artist', ''), 'license': v.get('license', ''), 'source': v.get('source_page', '')}
       for k, v in img.items() if os.path.exists(v['file'])}
json.dump({'dex': dex, 'img': img}, open('data/dex.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('도감', len(dex), '사진', len(img))
