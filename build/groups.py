# 날마다 모든 칸을 한 묶음에 넣는다 — 행성계(힐 구) 먼저, 나머지는 태양 거리 띠
import json, math
from bodies import B
AU = 149597870.7
N_DAYS = 1097
HZ = {}
for b in B:
    try: HZ[b[0]] = json.load(open('raw/hz/%s.json' % b[0]))
    except FileNotFoundError: pass
def at(i, day, P):
    s = HZ.get(i)
    if s and day < len(s): return s[day][1:]
    return None
FALLBACK = {'junoprobe': 'jupiter', 'psycheprobe': 'psyche', 'hera': 'didymos', 'bepi': 'mercury',
            'iss': 'earth', 'tiangong': 'earth', 'hubble': 'earth', 'danuri': 'moon'}
def positions(day):
    P = {}
    for b in B:
        v = at(b[0], day, P)
        if v is not None: P[b[0]] = v
    for i, host in FALLBACK.items():
        if i not in P: P[i] = P[host]
    P['soho'] = [x * 0.99 for x in P['earth']]
    return P
HILL = {'mercury': .22e6, 'venus': 1.0e6, 'earth': 1.7e6, 'mars': .98e6, 'jupiter': 53e6, 'saturn': 65e6,
        'uranus': 70e6, 'neptune': 116e6, 'pluto': 6.0e6}
BANDS = [(0, .75, 'sunside', '태양 곁'), (.75, 1.8, 'inner', '내행성 사이'), (1.8, 4.2, 'belt', '소행성대'),
         (4.2, 6.5, 'trojan', '목성 궤도'), (6.5, 32, 'outer', '외행성 사이'), (32, 60, 'kuiper', '카이퍼대'),
         (60, 1e9, 'beyond', '태양권 너머')]
def group_of(i, P):
    if i in HILL: return i
    if i == 'sun': return 'sunside'
    best = None
    for pl, h in HILL.items():
        d = math.dist(P[i], P[pl])
        if d < h and (best is None or d < best[1]): best = (pl, d)
    if best: return best[0]
    r = math.hypot(*P[i]) / AU
    for lo, hi, gid, _ in BANDS:
        if lo <= r < hi: return gid
if __name__ == '__main__':
    import collections
    sizes = collections.defaultdict(list); moves = collections.Counter(); prev = {}
    for day in range(N_DAYS):
        P = positions(day)
        g = collections.Counter()
        for b in B:
            gid = group_of(b[0], P); assert gid, (b[0], day)
            g[gid] += 1
            if b[0] in prev and prev[b[0]] != gid: moves[b[0]] += 1
            prev[b[0]] = gid
        for gid in list(HILL) + [x[2] for x in BANDS]: sizes[gid].append(g[gid])
    names = dict([(x[2], x[3]) for x in BANDS] + [(b[0], b[1] + '계') for b in B if b[0] in HILL])
    for gid, v in sizes.items(): print('%-8s %-10s 최소 %3d  최대 %3d  평균 %5.1f' % (gid, names[gid], min(v), max(v), sum(v) / len(v)))
    print('3년 동안 묶음을 옮기는 칸', len(moves), dict(moves.most_common(8)))
