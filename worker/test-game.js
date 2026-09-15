// node test-game.js — 오늘 위치로 순서·점수가 말이 되는지 본다
import fs from 'node:fs';
import { UNITS, N, INDEX, EPOCH, kstDay, puzzleNo, answerIndex, ranks, judge, score, DAY0 } from './src/game.js';
const assert = (c, m) => { if (!c) { console.error('실패:', m); process.exit(1); } };
const S = JSON.parse(fs.readFileSync('../build/raw/pos-sample.json', 'utf8'));
const id = i => { assert(INDEX.has(i), i); return INDEX.get(i); };
const nameOf = k => UNITS[k].name;

assert(N === 127, '칸 수 ' + N);
assert(S.day === DAY0 && puzzleNo(DAY0) === 1, '1호는 2026-09-15');
assert(puzzleNo(kstDay(Date.UTC(2026, 8, 14, 15))) === 1, '9/15 자정(KST) 이 1호');
const seen = new Set(); for (let d = EPOCH; d < EPOCH + N; d++) seen.add(answerIndex(d, 's')); assert(seen.size === N, '한 바퀴 중복');

const near = (ans, k) => { const R = ranks(S.p, id(ans)); return UNITS.map((_, i) => i).filter(i => R[i] > 0).sort((a, b) => R[a] - R[b]).slice(0, k).map(nameOf); };
console.log('지구 곁 5:', near('earth', 5).join(', '));
console.log('목성 곁 5:', near('jupiter', 5).join(', '));
console.log('보이저1 곁 3:', near('voyager1', 3).join(', '));
const Re = ranks(S.p, id('earth'));
assert(Re[id('iss')] <= 4, 'ISS 는 지구 코앞');
assert([...Re].sort((a, b) => a - b).every((r, i) => r === i), '순위 0..N-1');
assert(score(0) === 100 && score(126) === 1.72, '점수 끝값 ' + score(126));
assert(!('km' in judge(Re, id('earth'), id('moon'))), '거리는 밖으로 안 나감');
console.log('통과');
