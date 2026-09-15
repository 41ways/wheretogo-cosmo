# 행선지(wheretogo) index.html → 행선지3 index.html
#   python3 build/port/port.py ../wheretogo/index.html index.html build/port/cosmos-block.js
# 행선지 화면이 바뀌면 다시 돌린다. 바꿀 문장이 원본에 없으면 assert 로 멈추니, 그 자리를 새 원본에 맞춰 고친다.
import sys, re
SRC, DST, BLOCK = sys.argv[1], sys.argv[2], sys.argv[3]
WORD = 'COSMO'             # 표제 옆 영어 한 단어 — 행선지3: Cosmo
s = open(SRC, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (c, a[:90]); s = s.replace(a, b)
def block(start, end, new, keep_end=True):
    global s
    i = s.index(start); j = s.index(end, i)
    s = s[:i] + new + (s[j:] if keep_end else s[j + len(end):])

# ── 머리
rep('<title>행선지 — 오늘의 시·군 맞히기</title>', '<title>행선지3: %s — 오늘의 천체 맞히기</title>' % WORD.title())
s = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="태양계 127곳 가운데 오늘의 천체를 눌러서 찾는 하루 한 문제 게임. 가까운 순서 점수만 알려 주고, 거리는 날마다 실제 위치로 바뀐다.">', s, 1)
s = re.sub(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="행선지3: %s — 오늘의 천체 맞히기">' % WORD.title(), s, 1)
s = re.sub(r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="태양계 127곳 중 오늘의 행선지를 눌러서 찾아라. 제일 적게 불러 맞힌 사람이 1등.">', s, 1)
rep("<text y='26' font-size='26'>📍</text>", "<text y='26' font-size='26'>🪐</text>")

# ── 색: ② 밤하늘 금빛. 밝은 설정이어도 밤하늘로 둔다
block(':root{\n  --bg:#f6f5f2;', '*{box-sizing:border-box}', ''':root{
  color-scheme:dark;
  --bg:#0b1020; --panel:#111831; --line:#26304f; --ink:#eef1f8;
  --dim:#a9b1c7; --faint:#6f7896; --accent:#f2c14e; --accent-soft:#2a2410;
  --land:#1b2442; --land-line:#2a3462; --sea:#070b18;
  --red:#ff6a5c; --good:#5fc88a;
  --rule:#eef1f8; --stamp:#f2c14e;
  --shadow:none;
  --display:"Black Han Sans","Gothic A1",sans-serif;
  --serif:"Gothic A1",system-ui,sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
}
''')
rep('.redbar{width:min(620px,84%);height:8px;background:var(--accent);margin-top:30px}',
    '.redbar{width:min(620px,84%);height:13px;margin-top:30px;background:linear-gradient(var(--accent) 0 8px,transparent 8px 11px,var(--accent) 11px 13px)}\n.bigname .two{color:var(--accent)}')
rep('.start{margin-top:30px;border:0;background:var(--accent);color:#fff;', '.start{margin-top:30px;border:0;background:var(--accent);color:var(--bg);')
rep('.go{border:0;padding:0 22px;font-weight:700;letter-spacing:.1em;background:var(--accent);color:#fff;white-space:nowrap}',
    '.go{border:0;padding:0 22px;font-weight:700;letter-spacing:.1em;background:var(--accent);color:var(--bg);white-space:nowrap}')
rep('.map{position:relative;background:var(--sea);border:1px solid var(--line)}\n.map svg{display:block;width:100%;height:auto}', '''.map{position:relative;background:var(--sea);border:1px solid var(--line);aspect-ratio:1/1;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}
.map canvas{display:block;width:100%;height:100%;cursor:default}
.map canvas.onbody{cursor:pointer}
.map canvas:active{cursor:grabbing}
#labels{position:absolute;inset:0;pointer-events:none}
.lb{position:absolute;transform:translate(9px,-19px);font-size:11.5px;font-weight:700;white-space:nowrap;color:#d6dcee;text-shadow:0 0 3px var(--sea),0 0 3px var(--sea),0 0 3px var(--sea)}
.lb.sm{font-size:10.5px;font-weight:500;color:#9aa4c6}
.lb.got{font-weight:700}
.lb.on{color:var(--accent);font-size:12.5px;font-weight:700;z-index:2}
#labels .ring{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:1.5px solid var(--accent);opacity:.9}
#labels .ring.ans{width:34px;height:34px;margin:-17px 0 0 -17px;border-width:2px;box-shadow:0 0 0 5px rgba(242,193,78,.18)}
.crumb{position:absolute;left:12px;top:10px;font-family:var(--mono);font-size:11px;color:var(--accent);letter-spacing:.06em;z-index:3}
.crumb span{color:var(--faint);margin:0 3px}
.mbtns{position:absolute;right:10px;top:10px;display:flex;flex-direction:column;gap:6px;z-index:3}
.mbtns button{font:inherit;font-size:11.5px;font-weight:700;background:var(--panel);color:var(--ink);border:1.5px solid var(--ink);padding:5px 9px;cursor:pointer;letter-spacing:.04em}
.mbtns button:hover{border-color:var(--accent);color:var(--accent)}
.mbtns .back2{border-color:var(--accent);color:var(--accent)}
/* 3D·2D — 금색 밑줄이 고른 쪽 아래로 미끄러진다 */
.vtog{position:relative;display:grid;grid-template-columns:1fr 1fr;align-self:flex-end;padding:0 0 5px}
.vtog::after{content:"/";position:absolute;left:50%;top:5px;transform:translateX(-50%);font-family:var(--mono);font-size:13px;color:#3a4570;pointer-events:none}
.vtog::before{content:"";position:absolute;bottom:0;left:calc(25% - 12px);width:24px;height:3px;background:var(--accent);
  box-shadow:0 0 8px rgba(242,193,78,.6);transition:left .34s cubic-bezier(.32,.72,0,1)}
.vtog.is2d::before{left:calc(75% - 12px)}
.mbtns .vtog button{border:0;background:none;padding:5px 12px 3px;min-width:46px;font-family:var(--mono);font-size:13px;font-weight:600;
  letter-spacing:.08em;color:var(--faint);text-shadow:0 0 6px #070b18;transition:color .25s}
.mbtns .vtog button.on{color:var(--ink)}
.mbtns .vtog button:hover{border:0;color:var(--accent)}
.mbtns .vtog button.on:hover{color:var(--ink)}
#labels .halo{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:2px solid;opacity:.9}
.maphint{position:absolute;left:12px;bottom:9px;font-size:10.5px;color:var(--faint);letter-spacing:.05em;pointer-events:none;z-index:3}
/* 도감 */
.dex{display:grid;grid-template-columns:104px 1fr;gap:12px;align-items:start;padding:12px;margin-bottom:12px;background:var(--sea);border:1px solid var(--line);min-height:128px}
.dex-img{width:104px;height:104px;background:#070b18;border:1px solid var(--line);overflow:hidden}
.dex-img img{display:block;width:100%;height:100%;object-fit:cover}
.dex-name{font-family:var(--display);font-size:22px;line-height:1.1}
.dex-sub{font-size:11px;color:var(--faint);margin-top:3px;letter-spacing:.02em}
.dex-sub span{color:var(--accent)}
.dex-desc{margin:7px 0 0;font-size:12.5px;line-height:1.6;color:var(--dim)}
.dex-facts{display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:6px;font-size:11px;color:var(--dim)}
.dex-facts b{color:var(--faint);font-weight:500;margin-right:3px}
.dex-got{margin-top:6px;font-family:var(--mono);font-size:11.5px;color:var(--accent)}
.dex-credit{margin-top:6px;font-size:9.5px;color:var(--faint);opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.dex-empty{grid-column:1/-1;align-self:center;text-align:center;font-size:12.5px;color:var(--faint);line-height:1.8}
@media (max-width:820px){ .dex{min-height:0} .dex:has(.dex-empty){padding:9px 12px} }
.field input[readonly]{cursor:default}''')
rep('.legend i{flex:1;height:6px;background:linear-gradient(90deg,#e0301e,#e96e5a 28%,#f0b6aa 60%,#b9b7b0)}',
    '.legend i{flex:1;height:6px;background:linear-gradient(90deg,#f2c14e,#d6b36a 22%,#9a9ab0 55%,#5a6690)}')
rep('.shape{display:block;width:auto;height:clamp(92px,24vw,128px);margin:0 auto 14px}',
    '.shape{display:block;width:clamp(96px,26vw,132px);height:clamp(96px,26vw,132px);object-fit:cover;margin:0 auto 14px;border:1px solid var(--line)}')

# ── 타이틀
rep('<h1 class="bigname">행선지</h1>', '<h1 class="bigname">행선지<span class="two">3</span></h1>')
rep('<p class="eyebrow">오늘의 시·군 맞히기</p>', '<p class="eyebrow">%s · 오늘의 천체 맞히기</p>' % WORD)
block('    <p class="lede">전국 시·군', '    <div class="tstats"', '''    <p class="lede">태양계 <b id="tn">127</b>곳 가운데 오늘 한 곳이 행선지입니다.<br>
      천체를 눌러 부르면 <b>몇 번째로 가까운지</b>만 알려 줍니다.<br>
      거리는 날마다 실제 위치로 바뀝니다.</p>
''')

# ── 게임 머리·지도·부르기 칸
rep('<h1 id="toTitle" title="처음으로"><span class="ttl">행선지</span> <span class="no" id="no"></span></h1>',
    '<h1 id="toTitle" title="처음으로"><span class="ttl">행선지<span style="color:var(--accent)">3</span></span> <span class="w" style="font-family:var(--mono);font-size:.46em;font-weight:600;color:var(--accent);letter-spacing:.06em">%s</span> <span class="no" id="no"></span></h1>' % WORD)
rep('<p class="sub">가까운 순서만 보고 오늘의 시·군을 맞히세요.</p>', '<p class="sub">가까운 순서만 보고 오늘의 천체를 눌러 찾으세요.</p>')
block('        <svg id="map" role="img" aria-label="전국 시·군 지도"></svg>', '      <div class="legend">', '''        <div id="labels"></div>
        <div class="crumb" id="crumb">태양계</div>
        <div class="mbtns">
          <div class="vtog" id="vtog" role="group" aria-label="시점"><button data-v="3d" class="on">3D</button><button data-v="2d">2D</button></div>
          <button id="bBack" class="back2" hidden>← 뒤로가기</button>
        </div>
        <div class="maphint" id="maphint">천체를 누르면 그 묶음이 펼쳐집니다</div>
        <div class="tip" id="tip" hidden></div>
      </div>
''')
rep('<div class="credit">경계 vuski/admdongkor (2026.7.1 행정동) · 청사 위치 © OpenStreetMap 기여자</div>',
    '<div class="credit">위치 NASA JPL Horizons (한국 시간 정오) · 행성 텍스처 Solar System Scope (CC BY 4.0) · 사진 출처는 도감 카드에 · 거리는 로그 눈금</div>')
rep('''      <div id="askform">
        <form class="field" id="askf" autocomplete="off">''', '''      <div class="dex" id="dex"></div>
      <div id="askform">
        <form class="field" id="askf" autocomplete="off">''')
rep('placeholder="시·군 이름 (수원, 경기, ㅊㅊ …)" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="go" aria-autocomplete="list" aria-controls="sug" disabled>',
    'placeholder="지도에서 천체를 고르세요" readonly autocomplete="off" disabled>')
rep('<thead><tr><th>#</th><th>시·군</th>', '<thead><tr><th>#</th><th>천체</th>')
rep('<div class="empty" id="empty">아무 데나 하나 불러 보세요.<br>점수를 보고 좁혀 가면 됩니다.</div>',
    '<div class="empty" id="empty">아무 천체나 하나 불러 보세요.<br>점수를 보고 좁혀 가면 됩니다.</div>')

# ── 규칙
block('      <li>매일 자정(한국 시간)에 전국', '    </ul>', '''      <li>매일 자정(한국 시간)에 태양계 <b>127곳</b> — 태양·행성·왜행성·위성·소행성·혜성·탐사선 — 가운데 하나가 행선지가 됩니다.</li>
      <li>천체를 부르면 그 천체가 <b>정답에서 몇 번째로 가까운지</b>와 그 순서로 매긴 <b>100점 만점 점수</b>를 알려 줍니다. 한 계단마다 0.78점씩 낮아집니다.</li>
      <li>거리는 <b>그날 한국 시간 정오의 실제 위치</b>로 잽니다 (NASA JPL Horizons). 행성이 움직이니 같은 정답이라도 날마다 순서가 달라집니다.</li>
      <li><b>누르기로만</b> 부릅니다. 지도에서 천체를 누르면 그 천체가 속한 <b>묶음</b>이 펼쳐지고, 펼친 화면에서 누르면 부릅니다. 손가락은 한 번 눌러 고르고 한 번 더 누르거나 부르기를 누릅니다.</li>
      <li>묶음은 <b>행성계</b>(그 행성 힐 구 안)와, 그 밖은 태양에서의 <b>거리 띠</b>(태양 곁 · 내행성 사이 · 소행성대 · 목성 궤도 · 외행성 사이 · 카이퍼대 · 태양권 너머)입니다. 날마다 실제 위치로 정해지므로 오가는 천체는 묶음이 바뀝니다. 제임스 웹·유클리드·SOHO 는 늘 지구계입니다.</li>
      <li>지도는 방향은 실제, 태양에서의 거리는 로그 눈금으로 줄였고, 천체 크기는 종류별로 정한 크기입니다. 판정은 화면과 상관없이 실제 3차원 거리로 합니다.</li>
      <li><b>하루 한 판</b>입니다. <b>무한 모드</b>는 기록 없이 몇 판이든 할 수 있습니다.</li>
      <li>시계는 <b>첫 추측부터</b> 정답까지 서버가 잽니다. 순위는 <b>적게 부른 순</b>, 횟수가 같으면 빠른 순입니다. 포기하면 순위에 오르지 않습니다.</li>
''')

# ── 이지 모드 없음 — 이름을 보고 누르는 게임이라 따로 쉬운 판이 필요 없다
rep('<button class="start ghost" id="btnEasy">이지 모드</button>', '<button class="start ghost" id="btnEasy" hidden>이지 모드</button>')

# ── 새 판을 열 때마다 태양계 전체 화면으로 — 오늘 판에서 펼친 행성계가 무한 모드로 이어지지 않게
rep("function startGame(){\n  $('#title').hidden = true;\n  $('#game').hidden = false;", "function startGame(){\n  $('#title').hidden = true;\n  $('#game').hidden = false;\n  resetView();")

# ── 스크립트
rep('<script>\n(function(){', '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>\n<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>\n<script>\n(function(){')
rep("var API = /^(localhost|127\\.0\\.0\\.1)$/.test(location.hostname) ? 'http://localhost:8832' : 'https://eodigun.41ways.workers.dev';",
    "var API = /^(localhost|127\\.0\\.0\\.1)$/.test(location.hostname) ? 'http://localhost:8837' : 'https://wheretogo-cosmos.41ways.workers.dev';")
rep("var SHARE_URL = 'https://41ways.github.io/wheretogo/';", "var SHARE_URL = 'https://41ways.github.io/wheretogo-cosmo/';")
s = s.replace("'eodigun-", "'cosmos-").replace("'wheretogo-free'", "'cosmos-free'").replace("'wheretogo-easy'", "'cosmos-easy'")
rep('  day:null, no:null, n:165, offset:0,', '  day:null, no:null, n:127, offset:0,')
rep('var STOPS = [[0,[185,183,176]],[.55,[240,182,170]],[.82,[233,110,90]],[1,[224,48,30]]];', 'var STOPS = [[0,[90,102,144]],[.55,[154,154,176]],[.82,[214,179,106]],[1,[242,193,78]]];')
rep("  if (rank <= 30) return '가까움';\n  if (rank <= 70) return '그럭저럭';\n  if (rank <= 120) return '멂';\n  return '아주 멂';",
    "  if (rank <= 25) return '가까움';\n  if (rank <= 55) return '그럭저럭';\n  if (rank <= 95) return '멂';\n  return '아주 멂';")

# 지도 → 태양계 엔진
block('// ══════════════════════════════ 지도\n', '// ══════════════════════════════ 찾기 (이름·초성)', open(BLOCK, encoding='utf-8').read())
# 찾기 → 누르기 전용이라 이름 찾기는 없다
block('// ══════════════════════════════ 찾기 (이름·초성)', 'var sugIdx = [], sugSel = 0', '''// ══════════════════════════════ 찾기 — 누르기로만 부르므로 비어 있다
function search(){ return []; }
function regionQuery(){ return null; }
function cho(s){ return s; }

''')
block('function submit(){', '\n// ══════════════════════════════ 부르기', 'function submit(){ callSelected(); }\n')
rep("  var call = S.free ? api('/api/free/guess', { rid:S.free, id:u.id })", "  var call = S.free ? api('/api/free/guess', { rid:S.free, id:u.id, easy:!!S.easy })")
rep("    S.list.push({ id:r.id, score:r.score, rank:r.rank, correct:r.correct, no:S.list.length + 1 });",
    "    S.list.push({ id:r.id, score:r.score, rank:r.rank, correct:r.correct, km:r.km, no:S.list.length + 1 });\n    selectBody(null);")
rep("      '<div class=\"nm\">' + esc(u.name) + '<small>' + esc(u.sub) + '</small></div>' +", "      '<div class=\"nm\">' + esc(u.name) + '<small>' + esc(KIND[u.kind]) + '</small></div>' +")
rep("      '<div class=\"rk num\">' + (S.n - 1) + '곳 중 ' + g.rank + '번째로 가까움</div>' +",
    "      '<div class=\"rk num\">' + (S.n - 1) + '곳 중 ' + g.rank + '번째로 가까움' + (g.km != null ? ' · ' + Number(g.km).toLocaleString('ko-KR') + ' km' : '') + '</div>' +")
rep("'</b><span class=\"s\">' + esc(u.sub) + '</span></td>' +", "'</b><span class=\"s\">' + esc(KIND[u.kind]) + '</span></td>' +")
rep("  var t = '행선지 제' + S.no + '호 — '", "  var t = '행선지3 제' + S.no + '호 — '")
rep("'지도에 마우스를 올려 보고, 눌러서 부르세요. 이름을 적어도 됩니다.'", "'천체에 올려 도감을 보고, 묶음을 펼쳐 눌러서 부르세요. 이지 모드는 거리(km)도 알려 줍니다.'")
rep("'지도를 누르면 이름이 보이고, 한 번 더 누르면 부릅니다.'", "'묶음을 펼친 뒤 천체를 한 번 눌러 고르고, 한 번 더 누르면 부릅니다. 거리(km)도 알려 줍니다.'")
s = s.replace("msg('어디든 하나 불러서 시작하세요.');", "msg('천체를 눌러 묶음을 펼치고, 거기서 불러 보세요.');")
s = s.replace("'어디든 하나 불러서 시작하세요.'", "'천체를 눌러 묶음을 펼치고, 거기서 불러 보세요.'")
s = s.replace("msg(S.list.length ? '' : '어디든 하나 불러서 시작하세요.');", "msg(S.list.length ? '' : '천체를 눌러 묶음을 펼치고, 거기서 불러 보세요.');")

# 정답 모양 → 도감 사진
block('/* 정답 칸의 윤곽', 'function renderDone(){', '''/* 정답 천체 — 도감 사진 */
function shapeSvg(id){
  var img = IMG[id], i = BY[id];
  if (i == null) return '';
  return (img ? '<img class="shape" src="' + esc(img.file) + '" alt="">' : '') +
    '<p class="shapecap">' + esc((DEX[id] || {}).sub || KIND[U[i].kind]) + ' · ' + esc(groupName(SKYG ? SKYG[i] : '')) + '</p>';
}

''')

# 시작 — 칸·도감을 받고 엔진을 세운다
block("fetch('map.json').then(function(r){ return r.json(); }).then(function(m){", "}).catch(function(e){ msg('지도를 못 불러왔습니다: ' + e.message, true); });", '''var DEX = {}, IMG = {};
Promise.all(['data/bodies.json', 'data/dex.json'].map(function(u){ return fetch(u + '?v=__V__').then(function(r){ return r.json(); }); })).then(function(res){
  U = res[0].bodies;
  res[0].groups.forEach(function(g){ GROUP_META[g.id] = g; });
  DEX = res[1].dex || {}; IMG = res[1].img || {};
  U.forEach(function(u, i){ BY[u.id] = i; u.sub = KIND[u.kind]; });
  buildMap();
  showDex(null);
  return load();
''', keep_end=True)
rep("}).catch(function(e){ msg('지도를 못 불러왔습니다: ' + e.message, true); });", "}).catch(function(e){ msg('태양계를 못 불러왔습니다: ' + e.message, true); });")
rep("    S.day = r.day; S.no = r.no; S.n = r.n;", "    S.day = r.day; S.no = r.no; S.n = r.n;\n    setSky(r.p, r.g);")
# 데이터가 바뀌면 주소도 바뀌게 — Pages 캐시에 옛 데이터와 새 화면이 섞이지 않게
import hashlib, os
root = os.path.dirname(os.path.abspath(DST))
v = hashlib.sha1(b''.join(open(os.path.join(root, f), 'rb').read() for f in ('data/bodies.json', 'data/dex.json'))).hexdigest()[:10]
rep("'?v=__V__'", "'?v=" + v + "'")
open(DST, 'w', encoding='utf-8').write(s)
print('ok', len(s), v)
