# 각 칸이 2026-09-15 와 2028-09-15 에 Horizons 위치가 있는지
import urllib.request, urllib.parse, json, time, sys
from bodies import B
def vec(cmd, date):
    d2 = time.strftime('%Y-%m-%d', time.gmtime(time.mktime(time.strptime(date, '%Y-%m-%d')) + 86400 + 43200))
    q = {'format':'json','COMMAND':"'%s'"%cmd,'EPHEM_TYPE':'VECTORS','CENTER':"'500@10'",'START_TIME':"'%s'"%date,'STOP_TIME':"'%s'"%d2,
         'STEP_SIZE':"'1 d'",'VEC_TABLE':"'1'",'OUT_UNITS':"'KM-S'",'CSV_FORMAT':"'YES'",'OBJ_DATA':"'NO'"}
    url = 'https://ssd.jpl.nasa.gov/api/horizons.api?' + urllib.parse.urlencode(q)
    for k in range(3):
        try:
            r = json.load(urllib.request.urlopen(url, timeout=60)); break
        except Exception as e:
            time.sleep(3); r = {'result': 'ERR ' + str(e)}
    t = r.get('result', '') or r.get('error', '')
    if '$$SOE' in t: return 'ok'
    t = ' '.join(t.split())
    for key in ('No ephemeris', 'prior to', 'after', 'Multiple', 'No matches', 'not found', 'Cannot', 'ERR'):
        if key in t:
            i = t.find(key); return 'X ' + t[max(0, i-40):i+90]
    return 'X ' + t[:130]
out = {}
for b in B:
    a = vec(b[4], '2026-09-15'); c = vec(b[4], '2028-09-15')
    out[b[0]] = (a, c)
    if a != 'ok' or c != 'ok': print(b[0], b[1], '|', a, '|', c, flush=True)
    time.sleep(0.3)
json.dump(out, open('raw/probe.json', 'w'), ensure_ascii=False, indent=0)
print('done', sum(1 for v in out.values() if v == ('ok', 'ok')), '/', len(out))
