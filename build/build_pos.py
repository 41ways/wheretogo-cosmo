# 날마다 127칸의 태양 중심 황도 좌표(km)와 묶음을 만든다.
#   python3 fetch.py → python3 build_pos.py → data/bodies.json, raw/pos.sql(D1), raw/pos-sample.json
import json, math, datetime
from bodies import B
import groups as G

IDS = [b[0] for b in B]
IDX = {i: k for k, i in enumerate(IDS)}
T0 = datetime.datetime(2026, 9, 15, 3, 0)                      # 한국 시간 2026-09-15 정오
KST_DAY0 = (int(T0.replace(tzinfo=datetime.timezone.utc).timestamp() * 1000) + 9 * 3600000) // 86400000
N_DAYS = G.N_DAYS

def orbit(center, r, inc_deg, period_min, phase, day):
    """원궤도 모형 — 중심 천체 둘레를 도는 점. 황도면에서 inc 만큼 기운 궤도"""
    t = day * 1440.0
    a = 2 * math.pi * ((t / period_min + phase) % 1.0)
    inc = math.radians(inc_deg)
    return [center[0] + r * math.cos(a), center[1] + r * math.sin(a) * math.cos(inc), center[2] + r * math.sin(a) * math.sin(inc)]

MODELS = {   # id: (중심, 반지름 km, 기울기, 주기 분, 위상)
    'iss': ('earth', 6791, 51.6, 92.9, .00), 'tiangong': ('earth', 6760, 41.5, 91.6, .37),
    'hubble': ('earth', 6915, 28.5, 95.4, .71), 'danuri': ('moon', 1837, 90.0, 118.0, .15),
}
def build():
    days = []
    last_rel = {}
    for day in range(N_DAYS):
        P = {}
        for i in IDS:
            s = G.HZ.get(i)
            if s and day < len(s): P[i] = list(s[day][1:])
        for i, (c, r, inc, per, ph) in MODELS.items(): P[i] = orbit(P[c], r, inc, per, ph, day)
        P['soho'] = [x * (1 - 1.5e6 / math.hypot(*P['earth'])) for x in P['earth']]          # 태양–지구 L1
        # 예측이 끝난 탐사선 — 도착지 곁으로 이어 붙인다
        for i, host, arrive_day, final_km in (('junoprobe', 'jupiter', None, None), ('bepi', 'mercury', None, None),
                                              ('hera', 'didymos', 104, 30), ('psycheprobe', 'psyche', 1050, 800)):
            if i in P and i in G.HZ and day < len(G.HZ[i]):
                last_rel[i] = (day, [P[i][k] - P[host][k] for k in range(3)]); continue
            d0, rel = last_rel[i]
            if arrive_day:
                k = min(1.0, (day - d0) / max(1, arrive_day - d0))
                n = math.hypot(*rel); want = n + (final_km - n) * k
                rel = [v / n * want for v in rel]
            P[i] = [P[host][k] + rel[k] for k in range(3)]
        g = []
        for i in IDS:
            gid = 'earth' if i in ('jwst', 'euclid', 'soho') else G.group_of(i, P)
            g.append(gid)
        days.append(([[round(v) for v in P[i]] for i in IDS], g))
    return days

if __name__ == '__main__':
    days = build()
    kinds = {b[0]: b[2] for b in B}
    bodies = [{'id': b[0], 'name': b[1], 'kind': b[2], 'parent': b[3]} for b in B]
    groups = [{'id': x, 'name': dict((b[0], b[1]) for b in B)[x] + '계', 'type': 'system'} for x in G.HILL] + \
             [{'id': x[2], 'name': x[3], 'type': 'band', 'from': x[0], 'to': x[1] if x[1] < 1e8 else None} for x in G.BANDS]
    json.dump({'day0': KST_DAY0, 'days': N_DAYS, 'bodies': bodies, 'groups': groups}, open('../data/bodies.json', 'w'), ensure_ascii=False, indent=1)
    with open('raw/pos.sql', 'w') as f:
        f.write('DELETE FROM pos;\n')
        for k, (p, g) in enumerate(days):
            f.write("INSERT INTO pos (day, data) VALUES (%d, '%s');\n" % (KST_DAY0 + k, json.dumps({'p': p, 'g': g}, separators=(',', ':'))))
    json.dump({'day': KST_DAY0, 'p': days[0][0], 'g': days[0][1]}, open('raw/pos-sample.json', 'w'), separators=(',', ':'))
    import os, collections
    print('day0', KST_DAY0, '일수', len(days), 'SQL', round(os.path.getsize('raw/pos.sql') / 1e6, 2), 'MB')
    print('오늘 묶음', collections.Counter(days[0][1]))
    for i in ('iss', 'danuri', 'soho', 'hera', 'bepi', 'jwst'):
        p = days[0][0][IDX[i]]; host = {'iss':'earth','danuri':'moon','soho':'earth','hera':'didymos','bepi':'mercury','jwst':'earth'}[i]
        print(i, '→', host, round(math.dist(p, days[0][0][IDX[host]])), 'km', '/ 400일 뒤', round(math.dist(days[400][0][IDX[i]], days[400][0][IDX[host]])), 'km')
