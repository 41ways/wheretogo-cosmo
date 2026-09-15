# 행선지3: Cosmo

태양계 127곳 가운데 오늘의 천체를 **눌러서** 찾는 하루 한 문제 게임. 가까운 순서로 매긴 점수만 알려 주고, 거리는 날마다 실제 위치로 바뀐다. 제일 적게 불러 맞힌 사람이 1등.
[행선지](https://github.com/41ways/wheretogo)·[행선지2: World](https://github.com/41ways/wheretogo-world)에 이은 세 번째 편이다. 화면·서버 틀은 행선지를 가져왔고, 색은 밤하늘 금빛이다.

**하기 → https://41ways.github.io/wheretogo-cosmo/**

- 127곳 = 태양, 행성 8, 왜행성 9, 위성 52, 소행성 25, 혜성 10, 탐사선·우주정거장 22
- 거리는 **그날 한국 시간 정오의 실제 위치**(NASA JPL Horizons, 태양 중심 황도 좌표) 사이 3차원 거리. 행성이 움직이니 같은 정답도 날마다 순서가 달라진다
- 거리(km)는 브라우저에 안 나간다. 점수는 정답 100점, 한 계단마다 0.78점. **이지 모드**(기록 없음)만 km 를 알려 준다
- **누르기로만 부른다.** 지도(살짝 3D — 방향은 실제, 거리는 로그 눈금, 크기는 종류별)에서 천체를 누르면 그 **묶음**이 펼쳐지고, 펼친 화면에서 누르면 부른다
- 묶음은 날마다 서버가 정한다 — 행성계(힐 구 안, 명왕성 포함) 먼저, 나머지는 태양 거리 띠(태양 곁 · 내행성 사이 · 소행성대 · 목성 궤도 · 외행성 사이 · 카이퍼대 · 태양권 너머). 띠가 빈틈 없이 이어져 3년 동안 어느 날이든 모든 칸이 한 묶음에 들어간다. 제임스 웹·유클리드·SOHO 는 늘 지구계
- 호버하면 천체가 커지고 이름·도감(사진·설명·제원)이 뜬다

## 구조

| 경로 | 하는 일 |
|---|---|
| `index.html` | 화면 (GitHub Pages). **손으로 고치지 않는다** — `build/port/port.py` 가 행선지 index.html 에서 만든다 |
| `data/bodies.json` | 칸 127곳·묶음 이름·첫날(day0)·일수 |
| `data/dex.json` | 도감 설명(`build/dex.json`)과 사진 출처(`build/images.json`)를 합친 것 |
| `img/` | 도감 사진 |
| `worker/` | 정답·점수·순위 서버 — Cloudflare Worker `wheretogo-cosmos` + D1 `wheretogo-cosmos` (pos 표에 날마다 위치 한 줄) |
| `build/` | 위치·묶음·도감을 만드는 스크립트 |

## 위치 데이터 (2026-09-15 ~ 2029-09-15, 1,097일)

```sh
cd build
python3 fetch.py          # Horizons 에서 칸마다 매일 03:00 UT 좌표 → raw/hz/<id>.json
python3 build_pos.py      # 모형·이어 붙이기·묶음 → data/bodies.json, raw/pos.sql
cd ../worker && npx wrangler d1 execute wheretogo-cosmos --remote --file ../build/raw/pos.sql
```

- ISS·톈궁·허블(지구 원궤도), 다누리(달 원궤도), SOHO(L1)는 Horizons 예측이 짧아 처음부터 모형으로 계산한다
- 주노·베피콜롬보·헤라·프시케 탐사선은 예측이 끝난 뒤 도착지(목성·수성·디디모스·프시케) 곁으로 이어 붙인다
- **2029-09-15 이후는 위치가 없다.** 그 전에 fetch 범위를 늘려 다시 만들고 D1 에 넣어야 한다

## 화면 만들기 · 서버

```sh
python3 build/merge_dex.py
python3 build/port/port.py ../wheretogo/index.html index.html build/port/cosmos-block.js
cd worker && node test-game.js && npx wrangler deploy
```

## 출처

- 위치: [NASA JPL Horizons](https://ssd.jpl.nasa.gov/horizons/)
- 사진: 위키미디어 공용 — 사진마다 저작자·라이선스를 도감 카드와 `data/dex.json` 에 적었다
- 3D: [three.js](https://threejs.org/)
