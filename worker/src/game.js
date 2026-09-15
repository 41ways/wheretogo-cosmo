/* 행선지3: Cosmos — 정답 고르기와 거리·점수 계산.
   거리는 그날(한국 시간 정오) 실제 위치 사이의 3차원 거리다. 위치는 D1 pos 표에 날마다 한 줄 */
import META from '../../data/bodies.json' with { type: 'json' };

export const UNITS = META.bodies;
export const GROUPS = META.groups;
export const N = UNITS.length;
export const INDEX = new Map(UNITS.map((u, i) => [u.id, i]));
export const DAY0 = META.day0, DAYS = META.days;

/* 한국 날짜 번호. 자정(KST)에 다음 문제로 넘어간다 */
export const kstDay = (ms = Date.now()) => Math.floor((ms + 9 * 3600e3) / 86400e3);
/* 1번 문제 = 2026-09-15 (KST) */
export const EPOCH = DAY0;
export const puzzleNo = day => day - EPOCH + 1;

function hash(str) {                       // xmur3
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* 127일에 한 바퀴. 한 바퀴 안에서는 같은 천체가 두 번 나오지 않는다 */
const orders = new Map();
export function answerIndex(day, salt) {
  const k = day - EPOCH;
  const cycle = Math.floor(k / N), pos = ((k % N) + N) % N;
  const key = salt + ':' + cycle;
  let order = orders.get(key);
  if (!order) {
    const rnd = mulberry32(hash(key));
    order = UNITS.map((_, i) => i);
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    orders.set(key, order);
  }
  return order[pos];
}

/* 그날 위치에서 정답에 가까운 순서. 정답 자신은 0, 가장 가까운 천체가 1 */
export function ranks(P, ans) {
  const d = i => Math.hypot(P[i][0] - P[ans][0], P[i][1] - P[ans][1], P[i][2] - P[ans][2]);
  const order = UNITS.map((_, i) => i).filter(i => i !== ans).sort((a, b) => d(a) - d(b));
  const r = new Int16Array(N);
  order.forEach((i, k) => { r[i] = k + 1; });
  return r;
}

/* 점수 — 정답이 100점, 그 밖은 가까운 순서 한 계단마다 0.78점씩 낮아진다 (126번째가 1.72점).
   거리를 수치로 주면 원 세 개로 정답이 특정되므로 순서만 담는다 */
const STEP = 0.78;
export function score(rank) {
  return rank === 0 ? 100 : Math.round((100 - rank * STEP) * 100) / 100;
}

/* 무한 모드·이지 모드 — 판마다 서버가 무작위 표(rid)를 내주고, 정답은 그 표를 비밀값으로 섞어 되찾는다 */
export function freeAnswer(rid, salt) {
  return hash(salt + ':free:' + rid) % N;
}

export function judge(R, ans, guess) {
  return { id: UNITS[guess].id, score: score(R[guess]), rank: R[guess], correct: ans === guess };
}
