# JPL Horizons 에서 칸마다 매일 한국 시간 정오(03:00 UT)의 태양 중심 황도 좌표(km)를 받는다.
# 예측이 중간에 끊기면 끊긴 날까지만 받고, 나머지는 build_pos.py 가 모형으로 채운다.
import urllib.request, urllib.parse, json, time, re, os, sys
from bodies import B
START, STOP = '2026-09-15 03:00', '2029-09-15 03:00'
MODEL_ONLY = {'iss', 'tiangong', 'hubble', 'soho', 'danuri'}      # 처음부터 모형으로 계산
def call(cmd, start, stop):
    q = {'format':'json','COMMAND':"'%s'"%cmd,'EPHEM_TYPE':'VECTORS','CENTER':"'500@10'",'START_TIME':"'%s'"%start,
         'STOP_TIME':"'%s'"%stop,'STEP_SIZE':"'1 d'",'VEC_TABLE':"'1'",'OUT_UNITS':"'KM-S'",'CSV_FORMAT':"'YES'",
         'OBJ_DATA':"'NO'",'REF_PLANE':"'ECLIPTIC'",'REF_SYSTEM':"'ICRF'"}
    url = 'https://ssd.jpl.nasa.gov/api/horizons.api?' + urllib.parse.urlencode(q)
    for k in range(4):
        try: return json.load(urllib.request.urlopen(url, timeout=120)).get('result', '')
        except Exception as e: err = str(e); time.sleep(5)
    return 'ERR ' + err
for b in B:
    out = 'raw/hz/%s.json' % b[0]
    if b[0] in MODEL_ONLY or os.path.exists(out): continue
    stop = STOP
    for attempt in range(3):
        t = call(b[4], START, stop)
        if '$$SOE' in t: break
        m = re.search(r'No ephemeris for target .*? after A\.D\. (\d{4})-([A-Z]{3})-(\d{2})', t)
        if not m: print('실패', b[0], ' '.join(t.split())[:160], flush=True); t = ''; break
        mon = {'JAN':1,'FEB':2,'MAR':3,'APR':4,'MAY':5,'JUN':6,'JUL':7,'AUG':8,'SEP':9,'OCT':10,'NOV':11,'DEC':12}[m.group(2)]
        stop = '%s-%02d-%s 00:00' % (m.group(1), mon, m.group(3))       # 끊긴 날 자정까지만
    if '$$SOE' not in t: continue
    rows = []
    for line in t.split('$$SOE')[1].split('$$EOE')[0].strip().split('\n'):
        f = [x.strip() for x in line.split(',')]
        rows.append([f[1], round(float(f[2])), round(float(f[3])), round(float(f[4]))])
    json.dump(rows, open(out, 'w'))
    print(b[0], len(rows), rows[-1][0], flush=True)
    time.sleep(0.3)
print('끝')
