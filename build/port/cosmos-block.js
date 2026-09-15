// ══════════════════════════════ 태양계 (살짝 3D)
/* 전체 화면은 길잡이 — 천체를 누르면 그 천체가 속한 묶음(행성계·거리 띠)이 펼쳐진다.
   펼친 화면에서 누르면 부른다. 묶음은 서버가 날마다 정해 보낸다(g).
   거리는 방향은 실제, 태양에서의 거리는 로그 눈금. 천체 크기는 종류별로 정한 크기다 */
var KIND = { star:'항성', planet:'행성', dwarf:'왜행성', moon:'위성', asteroid:'소행성', comet:'혜성', craft:'탐사선' };
var AU = 149597870.7, AU_MIN = .25, AU_MAX = 160, R0 = 6, R1 = 100;
var GOLD = 0xf2c14e, PALE = 0xc9d0e6, DIM = 0x6a76a0, MOON = 0x9aa4c6;
var SKYP = null, SKYG = null, GROUP_META = {};
var T = null;                                   // three 상태
var VIEW = { gid:null }, HOV = null, SEL = null, touch = false, armed = null, flying = null;
var TILT_3D = 55, TILT_MIN = 25 * Math.PI / 180, TILT_MAX = 70 * Math.PI / 180;   // 3D 기본 기울기와 손으로 기울일 수 있는 범위
var SIZE = { star:2.3, planet:1.1, dwarf:.66, asteroid:.36, comet:.4, craft:.44, moon:.5 };
/* 태양·행성·달은 실제 표면 텍스처(Solar System Scope, CC BY 4.0)를 입히고 태양 쪽에서 빛을 받는다.
   크기는 실제 비율을 누그러뜨렸다 — 목성이 화성보다 커 보이되 작은 천체도 보이게 */
var TEX = { sun:'sun', mercury:'mercury', venus:'venus_atmosphere', earth:'earth_daymap', mars:'mars', jupiter:'jupiter', saturn:'saturn', uranus:'uranus', neptune:'neptune', moon:'moon' };
var SIZE_ID = { sun:2.7, mercury:.72, venus:.96, earth:1.0, mars:.82, jupiter:1.7, saturn:1.5, uranus:1.22, neptune:1.2, moon:.55 };
function sizeOf(u){ return SIZE_ID[u.id] || SIZE[u.kind]; }
function textured(i){ return !!TEX[U[i].id]; }

function logR(r){ return r < AU_MIN ? R0 * r / AU_MIN : R0 + (R1 - R0) * (Math.log10(r) - Math.log10(AU_MIN)) / (Math.log10(AU_MAX) - Math.log10(AU_MIN)); }
function mainPos(i){ var p = SKYP[i], x = p[0] / AU, y = p[1] / AU, z = p[2] / AU, r = Math.hypot(x, y, z) || 1e-9, k = logR(r) / r; return new THREE.Vector3(x * k, z * k, -y * k); }
function localPos(i, c){                         // 행성계 — 모천체에서의 거리(km)를 로그로
  var p = SKYP[i], q = SKYP[c], dx = p[0] - q[0], dy = p[1] - q[1], dz = p[2] - q[2], d = Math.hypot(dx, dy, dz) || 1;
  var R = Math.max(3.2, 3 + 3.3 * Math.log10(d / 3000)), k = R / d;
  return new THREE.Vector3(dx * k, dz * k, -dy * k);
}
/* 행성계 안 자리. 위성을 도는 탐사선(다누리)처럼 모천체가 행성이 아니면 모천체 곁에 살짝 떼어 둔다 —
   행성 기준 로그 눈금으로는 달과 같은 점에 겹쳐 따로 누를 수 없으므로 */
function sysPos(i, center){
  if (i === center) return new THREE.Vector3();
  var par = U[i].parent, pi = par != null ? BY[par] : null;
  if (pi != null && pi !== center && SKYG[pi] === SKYG[center]) {
    var p = SKYP[i], q = SKYP[pi], d = new THREE.Vector3(p[0] - q[0], p[2] - q[2], -(p[1] - q[1])).normalize();
    return localPos(pi, center).add(d.multiplyScalar(1.5));
  }
  return localPos(i, center);
}
function setSky(p, g){ SKYP = p; SKYG = g; if (T) { placeAll(true); paintMap(); } }
function members(gid){ var out = []; for (var i = 0; i < U.length; i++) if (SKYG[i] === gid) out.push(i); return out; }
function groupName(gid){ return (GROUP_META[gid] || {}).name || gid; }

function buildMap(){
  var stage = $('#mapwrap');
  var renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  stage.insertBefore(renderer.domElement, stage.firstChild);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1, .05, 3000);
  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.enablePan = false;
  controls.minPolarAngle = TILT_MIN; controls.maxPolarAngle = TILT_MAX;   // 살짝만 기울인다
  controls.rotateSpeed = .6;
  T = { renderer:renderer, scene:scene, camera:camera, controls:controls, meshes:[], rings:new THREE.Group(), stems:new THREE.Group(), cur:[], dst:[], op:[], opDst:[] };
  scene.add(T.rings); scene.add(T.stems);

  function ring(radius, color, opacity){
    var g = new THREE.BufferGeometry(), pts = [];
    for (var k = 0; k <= 160; k++) { var a = k / 160 * Math.PI * 2; pts.push(Math.cos(a) * radius, 0, Math.sin(a) * radius); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return new THREE.Line(g, new THREE.LineBasicMaterial({ color:color, transparent:true, opacity:opacity }));
  }
  T.ring = ring;
  T.mainRings = new THREE.Group();
  [.39, .72, 1, 1.52, 5.2, 9.54, 19.2, 30.1].forEach(function(r){ T.mainRings.add(ring(logR(r), 0x2a3462, .95)); });
  [50, 100].forEach(function(r){ T.mainRings.add(ring(logR(r), 0x1d2648, .8)); });
  var belt = new THREE.Mesh(new THREE.RingGeometry(logR(2.1), logR(3.3), 160), new THREE.MeshBasicMaterial({ color:0x141b36, side:THREE.DoubleSide, transparent:true, opacity:.85 }));
  belt.rotation.x = -Math.PI / 2; belt.position.y = -.03; T.mainRings.add(belt);
  T.localRings = new THREE.Group();
  [4.5, 8, 11.5, 15].forEach(function(r){ T.localRings.add(ring(r, 0x2a3462, .9)); });
  T.rings.add(T.mainRings); T.rings.add(T.localRings);
  [T.mainRings, T.localRings].forEach(function(g){ g.children.forEach(function(o){ o.userData.base = o.material.opacity; }); });
  T.ringMix = 0; T.ringMixDst = 0;                  // 0 = 태양계 궤도선, 1 = 행성계 궤도선

  /* 빛 — 태양 자리의 점광원과 약한 주변광. 행성계 화면에서는 태양이 있는 방향 먼 곳에 둔다 */
  T.light = new THREE.PointLight(0xffffff, 1.7, 0, 0); scene.add(T.light);
  T.lightDst = new THREE.Vector3();
  scene.add(new THREE.AmbientLight(0x8090b0, .5));
  var loader = new THREE.TextureLoader();
  function glowTexture(){                            // 태양 빛무리 — 가운데가 밝은 둥근 그러데이션
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,220,140,.9)'); gr.addColorStop(.25, 'rgba(255,190,90,.45)'); gr.addColorStop(1, 'rgba(255,160,60,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  var geo = {};
  U.forEach(function(u, i){
    var s = sizeOf(u), m;
    if (TEX[u.id]) {
      var tex = loader.load('tex/' + TEX[u.id] + '.jpg');
      var mat = u.kind === 'star' ? new THREE.MeshBasicMaterial({ map:tex, transparent:true, opacity:1 })
                                  : new THREE.MeshStandardMaterial({ map:tex, roughness:1, metalness:0, transparent:true, opacity:1 });
      m = new THREE.Mesh(new THREE.SphereGeometry(s, 48, 32), mat);
      m.rotation.x = .12;
      if (u.id === 'saturn') {                         // 토성 고리 — 텍스처를 반지름 방향으로 편다
        var rg = new THREE.RingGeometry(s * 1.25, s * 2.35, 96), pos = rg.attributes.position, uv = rg.attributes.uv, v3 = new THREE.Vector3();
        for (var k = 0; k < pos.count; k++) { v3.fromBufferAttribute(pos, k); uv.setXY(k, (v3.length() - s * 1.25) / (s * 1.1), .5); }
        var ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map:loader.load('tex/saturn_ring.png'), side:THREE.DoubleSide, transparent:true, opacity:.9, depthWrite:false }));
        ring.rotation.x = -Math.PI / 2 + .47; m.add(ring); m.userData.ring = ring;
      }
    } else {
      var key = u.kind === 'craft' ? 'o' + s : 's' + s;
      if (!geo[key]) geo[key] = u.kind === 'craft' ? new THREE.OctahedronGeometry(s) : new THREE.SphereGeometry(s, 22, 16);
      m = new THREE.Mesh(geo[key], new THREE.MeshBasicMaterial({ color:baseColor(u), transparent:true, opacity:1 }));
    }
    m.userData.i = i; scene.add(m); T.meshes.push(m); T.cur.push(new THREE.Vector3()); T.dst.push(new THREE.Vector3()); T.op.push(1); T.opDst.push(1);
    if (u.kind === 'star') {
      var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTexture(), color:0xffffff, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending }));
      glow.scale.setScalar(s * 7); T.glow = glow; scene.add(glow); T.sunI = i;
    }
  });
  camera.position.set(0, Math.cos(TILT_3D * Math.PI / 180) * 215, Math.sin(TILT_3D * Math.PI / 180) * 215);

  function resize(){ var w = stage.clientWidth, h = stage.clientHeight; if (!w) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  resize();

  /* 누르기 — 화면에서 가장 가까운 천체를 잡는다. 작은 점도 잘 눌린다 */
  var cv = renderer.domElement, down = null;
  function local(e){ var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  cv.addEventListener('pointerdown', function(e){ down = [e.clientX, e.clientY]; touch = e.pointerType !== 'mouse'; });
  cv.addEventListener('pointermove', function(e){
    if (e.buttons && down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) { setHover(null); return; }
    if (e.pointerType !== 'mouse') return;
    var xy = local(e); setHover(nearest(xy[0], xy[1]));
  });
  cv.addEventListener('pointerleave', function(){ if (!touch) setHover(null); });
  cv.addEventListener('pointerup', function(e){
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) { down = null; return; }
    down = null;
    var xy = local(e), i = nearest(xy[0], xy[1]);
    if (i == null) return;
    if (VIEW.gid == null) { openGroup(SKYG[i], i); return; }         // 전체 화면 — 길잡이
    if (SKYG[i] !== VIEW.gid) return;
    if (touch && armed !== i) { armed = i; setHover(i); selectBody(i); return; }   // 손가락은 한 번 더
    armed = null; selectBody(i); callSelected();
  });
  $('#bBack').onclick = function(){ openGroup(null); };
  document.querySelectorAll('#vtog button').forEach(function(b){ b.onclick = function(){ setDim(b.dataset.v); }; });
  setDim(lsGet('cosmos-view') === '2d' ? '2d' : '3d', true);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && VIEW.gid != null && !document.querySelector('dialog[open]')) openGroup(null); });

  placeAll(true);
  (function loop(){
    step(); controls.update(); renderer.render(scene, camera); drawLabels();
    requestAnimationFrame(loop);
  })();
}
function baseColor(u){ return u.kind === 'star' ? GOLD : u.kind === 'planet' ? PALE : u.kind === 'moon' ? MOON : DIM; }

/* 보기 바꾸기 — 천체들이 지금 자리에서 새 배치로 날아가고 카메라도 따라간다 */
function placeAll(instant){
  if (!T || !SKYP) return;
  var gid = VIEW.gid, meta = GROUP_META[gid], sys = meta && meta.type === 'system';
  var mem = gid == null ? null : members(gid), center = sys ? BY[gid] : null;
  U.forEach(function(u, i){
    /* 전체 화면에서는 행성계에 딸린 천체(위성·ISS …)를 행성 하나로 접는다 — 겹쳐서 행성이 안 눌리므로 */
    var folded = mem == null && GROUP_META[SKYG[i]] && GROUP_META[SKYG[i]].type === 'system' && BY[SKYG[i]] !== i;
    var inG = mem == null ? !folded : SKYG[i] === gid;
    if (mem == null) T.dst[i].copy(folded ? mainPos(BY[SKYG[i]]) : mainPos(i));
    else if (inG) T.dst[i].copy(sys ? sysPos(i, center) : mainPos(i));
    T.opDst[i] = inG ? 1 : (mem && !sys && u.kind === 'star' ? .35 : 0);
    if (instant) { T.cur[i].copy(T.dst[i]); T.op[i] = T.opDst[i]; }
  });
  T.ringMixDst = sys ? 1 : 0;
  /* 행성계에서는 태양이 없으니 태양 방향 먼 곳에 빛을 둔다 */
  if (sys) { var toSun = mainPos(center).multiplyScalar(-1).normalize(); T.lightDst.copy(toSun.multiplyScalar(80)); }
  else T.lightDst.copy(mainPos(T.sunI));
  /* 카메라가 볼 곳 */
  var target = new THREE.Vector3(), dist = 215;
  if (mem) {
    var pts = mem.map(function(i){ return T.dst[i]; }), c = new THREE.Vector3();
    pts.forEach(function(p){ c.add(p); }); c.multiplyScalar(1 / pts.length);
    var rad = 0; pts.forEach(function(p){ rad = Math.max(rad, p.distanceTo(c)); });
    target = sys ? new THREE.Vector3() : c;
    dist = sys ? 46 : Math.max(22, rad * 2.9 + 10);
  }
  T.controls.minDistance = mem ? Math.min(8, dist * .4) : 30; T.controls.maxDistance = mem ? dist * 3 : 360;
  flyCamera(target, dist, instant);
  $('#crumb').innerHTML = gid == null ? '태양계' : '태양계 <span>›</span> ' + esc(groupName(gid));
  $('#bBack').hidden = gid == null;
  $('#maphint').textContent = gid == null ? '천체를 누르면 그 묶음이 펼쳐집니다' : '천체를 눌러 부르기 · Esc 나 ← 뒤로가기';
  drawStems();
}
function flyCamera(target, dist, instant){
  var cam = T.camera, ctl = T.controls;
  var dir = cam.position.clone().sub(ctl.target); if (dir.lengthSq() < 1e-6) dir.set(0, 1, 1);
  dir.normalize();
  var to = target.clone().add(dir.multiplyScalar(dist));
  if (instant) { cam.position.copy(to); ctl.target.copy(target); ctl.update(); return; }
  flying = { t0:performance.now(), p0:cam.position.clone(), t0v:ctl.target.clone(), p1:to, t1v:target.clone() };
}
/* 3D ↔ 2D — 거리는 그대로 두고 기울기만 둥글게 바꾼다. 기울기 한도는 움직임이 끝난 뒤에 건다
   (먼저 걸면 OrbitControls 가 카메라를 한도 안으로 툭 끌어당겨 어색하다) */
function setDim(v, instant){
  var ctl = T.controls;
  document.querySelectorAll('#vtog button').forEach(function(b){ b.classList.toggle('on', b.dataset.v === v); b.setAttribute('aria-pressed', b.dataset.v === v); });
  $('#vtog').classList.toggle('is2d', v === '2d');
  lsSet('cosmos-view', v);
  T.stems.visible = v !== '2d';                       // 위에서 보면 높이선은 짧은 금만 남아 지저분하다
  T.dim = v;
  ctl.enableRotate = false; ctl.minPolarAngle = 0; ctl.maxPolarAngle = Math.PI / 2;
  tiltTo(v === '2d' ? .02 : TILT_3D, instant, function(){
    if (v === '2d') { ctl.minPolarAngle = 0; ctl.maxPolarAngle = .0004; }
    else { ctl.enableRotate = true; ctl.minPolarAngle = TILT_MIN; ctl.maxPolarAngle = TILT_MAX; }
  });
}
function tiltTo(deg, instant, done){
  var ctl = T.controls, cam = T.camera, off = cam.position.clone().sub(ctl.target);
  var sph = new THREE.Spherical().setFromVector3(off), to = deg * Math.PI / 180;
  if (instant) { sph.phi = to; cam.position.copy(ctl.target).add(new THREE.Vector3().setFromSpherical(sph)); ctl.update(); if (done) done(); return; }
  flying = { tilt:true, t0:performance.now(), phi0:sph.phi, phi1:to, r:sph.radius, theta:sph.theta, done:done };
}
/* 새 판 — 태양계 전체 화면, 고른 것·올린 것 없이. 오늘 판에서 펼친 행성계가 이어지지 않게 */
function resetView(){
  if (!T) return;
  VIEW.gid = null; armed = null;
  setHover(null); selectBody(null);
  placeAll(true);
  T.ringMix = T.ringMixDst; T.light.position.copy(T.lightDst);
  paintMap();
}
function openGroup(gid, focusI){
  VIEW.gid = gid; armed = null;
  setHover(null);
  if (gid == null) selectBody(null);
  placeAll(false);
  paintMap();
  if (focusI != null && gid != null) { setHover(focusI); selectBody(focusI); }
}
/* 한 프레임 — 자리·투명도·크기를 목표로 조금씩 */
function step(){
  var now = performance.now();
  if (flying && flying.tilt) {
    var kt = Math.min(1, (now - flying.t0) / 650), et = 1 - Math.pow(1 - kt, 3);          // 빨리 출발해 부드럽게 멈춘다
    var sp = new THREE.Spherical(flying.r, flying.phi0 + (flying.phi1 - flying.phi0) * et, flying.theta);
    T.camera.position.copy(T.controls.target).add(new THREE.Vector3().setFromSpherical(sp));
    if (kt >= 1) { var dn = flying.done; flying = null; if (dn) dn(); }
  } else if (flying) {
    var k = Math.min(1, (now - flying.t0) / 750), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    T.camera.position.lerpVectors(flying.p0, flying.p1, e); T.controls.target.lerpVectors(flying.t0v, flying.t1v, e);
    if (k >= 1) flying = null;
  }
  T.light.position.lerp(T.lightDst, .12);
  T.ringMix += (T.ringMixDst - T.ringMix) * .12;
  [[T.mainRings, 1 - T.ringMix], [T.localRings, T.ringMix]].forEach(function(q){
    q[0].visible = q[1] > .02;
    q[0].children.forEach(function(o){ o.material.opacity = o.userData.base * q[1]; });
    q[0].scale.setScalar(.7 + .3 * q[1]);            // 펼칠 때 자라나듯
  });
  for (var i = 0; i < T.meshes.length; i++) {
    var m = T.meshes[i];
    T.cur[i].lerp(T.dst[i], .14); T.op[i] += (T.opDst[i] - T.op[i]) * .16;
    m.position.copy(T.cur[i]);
    m.material.opacity = T.op[i];
    m.visible = T.op[i] > .02;
    var isCenter = VIEW.gid && GROUP_META[VIEW.gid].type === 'system' && i === BY[VIEW.gid];
    var want = isCenter ? (i === HOV ? 1.7 : 1.5) : (i === HOV ? 1.7 : 1);     // 가운데 행성은 둘레 천체를 가리지 않게 덜 부푼다
    var sc = m.scale.x + (want - m.scale.x) * .25; m.scale.setScalar(sc);
    if (U[i].kind === 'star' && T.glow) { T.glow.position.copy(m.position); T.glow.material.opacity = T.op[i]; T.glow.visible = m.visible; }
    if (TEX[U[i].id]) { m.rotation.y += U[i].kind === 'star' ? .0008 : .003; if (m.userData.ring) m.userData.ring.material.opacity = .9 * T.op[i]; }
  }
}
function drawStems(){
  while (T.stems.children.length) T.stems.remove(T.stems.children[0]);
  var sys = VIEW.gid && GROUP_META[VIEW.gid].type === 'system';
  U.forEach(function(u, i){
    if (T.opDst[i] < .5) return;
    var p = T.dst[i]; if (Math.abs(p.y) < .3) return;
    var g = new THREE.BufferGeometry().setFromPoints([p.clone(), new THREE.Vector3(p.x, 0, p.z)]);
    T.stems.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color:0x333e68, transparent:true, opacity:sys ? .8 : .55 })));
  });
}

/* 화면 좌표 */
function screenOf(i){
  var v = T.meshes[i].position.clone().project(T.camera), el = T.renderer.domElement;
  return [(v.x + 1) / 2 * el.clientWidth, (1 - v.y) / 2 * el.clientHeight, v.z];
}
function nearest(x, y){
  var best = null, bd = 20 * 20;
  for (var i = 0; i < U.length; i++) {
    if (T.opDst[i] < .5) continue;
    if (VIEW.gid != null && SKYG[i] !== VIEW.gid) continue;
    var s = screenOf(i); if (s[2] > 1) continue;
    var d = (s[0] - x) * (s[0] - x) + (s[1] - y) * (s[1] - y);
    if (U[i].kind === 'planet' || U[i].kind === 'star') d *= .6;      // 큰 천체는 조금 더 너그럽게
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

/* 이름표 — 겹치면 덜 중요한 것을 뺀다 */
var PRI = { star:0, planet:1, dwarf:2, craft:3, moon:3, comet:4, asteroid:4 };
function drawLabels(){
  if (!T || !SKYP) return;
  var el = T.renderer.domElement, W = el.clientWidth, H = el.clientHeight, gid = VIEW.gid;
  var cand = [];
  for (var i = 0; i < U.length; i++) {
    if (T.op[i] < .5) continue;
    var u = U[i], g = guessOf(u.id);
    var must = i === HOV || i === SEL || (S.answer && S.answer.id === u.id) || u.id === S.lastId;
    if (gid == null && !must && !(u.kind === 'planet' || u.kind === 'star' || u.id === 'pluto' || g)) continue;
    var s = screenOf(i); if (s[2] > 1 || s[0] < -20 || s[1] < -20 || s[0] > W + 20 || s[1] > H + 20) continue;
    cand.push({ i:i, s:s, pri:must ? -1 : (u.kind === 'planet' || u.kind === 'star') ? -.5 : g ? .5 : PRI[u.kind] });   // 행성·태양 이름표는 겹쳐도 빼지 않는다
  }
  cand.sort(function(a, b){ return a.pri - b.pri; });
  var boxes = [], h = '';
  cand.forEach(function(c){
    var u = U[c.i], name = shortName(u.name), w = name.length * 11 + 8, bx = [c.s[0] + 8, c.s[1] - 20, w, 15];
    var sysMeta = GROUP_META[u.id];
    if (gid == null && sysMeta && sysMeta.type === 'system') { var n = members(u.id).length - 1; if (n > 0) name += ' +' + n; }
    var hit = boxes.some(function(b){ return bx[0] < b[0] + b[2] && bx[0] + bx[2] > b[0] && bx[1] < b[1] + b[3] && bx[1] + bx[3] > b[1]; });
    if (hit && c.pri >= 0) return;
    boxes.push(bx);
    var off = (gid && GROUP_META[gid].type === 'system' && c.i === BY[gid]) ? 'margin-left:' + Math.round(T.renderer.domElement.clientWidth * .055) + 'px;' : '';
    var g = guessOf(u.id), cls = 'lb' + (c.i === HOV ? ' on' : '') + (g ? ' got' : '') + (u.kind === 'planet' || u.kind === 'star' ? '' : ' sm');
    h += '<div class="' + cls + '" style="' + off + 'left:' + c.s[0].toFixed(1) + 'px;top:' + c.s[1].toFixed(1) + 'px' + (g && !g.correct ? ';color:' + heat(g.rank) : '') + '">' + esc(name) + '</div>';
  });
  var marks = '';
  for (var ti = 0; ti < U.length; ti++) {                 // 텍스처 천체 — 부른 거리 색을 둘레 고리로
    if (!textured(ti) || T.op[ti] < .5 || U[ti].kind === 'star' && !guessOf(U[ti].id)) continue;
    var hc = colorOf(ti); if (hc === baseColor(U[ti])) continue;
    var ts = screenOf(ti); if (ts[2] > 1) continue;
    marks += '<span class="halo" style="left:' + ts[0].toFixed(1) + 'px;top:' + ts[1].toFixed(1) + 'px;border-color:#' + hc.toString(16).padStart(6, '0') + '"></span>';
  }
  [S.lastId && !S.answer ? BY[S.lastId] : null, S.answer ? BY[S.answer.id] : null].forEach(function(i, k){
    if (i == null || T.op[i] < .5) return;
    var s = screenOf(i); if (s[2] > 1) return;
    marks += '<span class="ring' + (k ? ' ans' : '') + '" style="left:' + s[0].toFixed(1) + 'px;top:' + s[1].toFixed(1) + 'px"></span>';
  });
  $('#labels').innerHTML = h + marks;
  var tip = $('#tip');
  if (HOV != null && T.op[HOV] > .5) {
    var s2 = screenOf(HOV), hu = U[HOV], gg = guessOf(hu.id);
    tip.innerHTML = esc(hu.name) + '<small>' + (VIEW.gid == null ? esc(groupName(SKYG[HOV])) + ' · 눌러서 펼치기'
      : gg ? (gg.correct ? '정답' : pts(gg.score) + ' · ' + gg.rank + '번째') : (touch && armed === HOV ? '한 번 더 누르면 부르기' : KIND[hu.kind] + ' · 눌러서 부르기')) + '</small>';
    tip.style.left = s2[0] + 'px'; tip.style.top = (s2[1] - 10) + 'px'; tip.hidden = false;
  } else tip.hidden = true;
}
function shortName(n){ return n.replace(' 우주망원경', '').replace('국제우주정거장(ISS)', 'ISS').replace(' 태양 탐사선', '').replace(' 혜성', ''); }

/* 올리기·고르기 — 도감 카드와 입력칸에 올린다 */
function setHover(i){
  if (i === HOV) return;
  if (HOV != null && T) tint(HOV, false);
  HOV = i;
  if (T) T.renderer.domElement.classList.toggle('onbody', i != null);
  if (i != null && T) { tint(i, true); showDex(i); }
  else showDex(SEL);
}
function tint(i, on){
  var mat = T.meshes[i].material;
  if (textured(i)) { if (mat.emissive) mat.emissive.setHex(on ? 0x4a3510 : 0x000000); else mat.color.setHex(on ? 0xfff0c8 : 0xffffff); }
  else mat.color.setHex(on ? GOLD : colorOf(i));
}
function selectBody(i){
  SEL = i;
  var q = $('#q');
  q.value = i == null ? '' : U[i].name;
  $('#go').disabled = i == null || S.solved || S.gaveup || VIEW.gid == null || SKYG[i] !== VIEW.gid;
  if (i != null) showDex(i); else if (HOV == null) showDex(null);
}
function callSelected(){
  if (SEL == null || VIEW.gid == null || SKYG[SEL] !== VIEW.gid) return;
  guess(SEL);
}
function colorOf(i){
  var u = U[i], g = guessOf(u.id);
  if (S.answer && S.answer.id === u.id) return GOLD;
  if (VIEW.gid == null && GROUP_META[u.id] && GROUP_META[u.id].type === 'system') {   // 접힌 행성계 — 안에서 부른 곳 중 가장 가까운 순서
    var best = null;
    S.list.forEach(function(x){ var k = BY[x.id]; if (SKYG[k] === u.id && (best == null || x.rank < best)) best = x.rank; });
    if (best != null) return best === 0 ? GOLD : parseInt(heatHex(best), 16);
  }
  if (g) return g.correct ? GOLD : parseInt(heatHex(g.rank), 16);
  return baseColor(u);
}
function heatHex(rank){ var m = heat(rank).match(/\d+/g); return m.slice(0, 3).map(function(v){ return (+v).toString(16).padStart(2, '0'); }).join(''); }
function paintMap(){
  if (!T) return;
  for (var i = 0; i < U.length; i++) if (i !== HOV && !textured(i)) T.meshes[i].material.color.setHex(colorOf(i));
  if (S.answer && VIEW.gid !== SKYG[BY[S.answer.id]]) openGroup(SKYG[BY[S.answer.id]], BY[S.answer.id]);
  $('#go').disabled = SEL == null || S.solved || S.gaveup || VIEW.gid == null;
}

/* 도감 카드 */
function showDex(i){
  var box = $('#dex');
  if (i == null) { box.innerHTML = '<div class="dex-empty">' + (matchMedia('(hover:hover)').matches ? '천체에 마우스를 올리면<br>도감이 펼쳐집니다' : '천체를 누르면 도감이 펼쳐집니다') + '</div>'; return; }
  var u = U[i], d = DEX[u.id] || {}, img = IMG[u.id], g = guessOf(u.id);
  box.innerHTML =
    '<div class="dex-img">' + (img ? '<img src="' + esc(img.file) + '" alt="">' : '') + '</div>' +
    '<div class="dex-body"><div class="dex-name">' + esc(u.name) + '</div>' +
    '<div class="dex-sub">' + esc(d.sub || KIND[u.kind]) + ' · <span>' + esc(groupName(SKYG ? SKYG[i] : '')) + '</span></div>' +
    '<p class="dex-desc">' + esc(d.desc || '') + '</p>' +
    (d.facts && d.facts.length ? '<div class="dex-facts">' + d.facts.map(function(f){ return '<span><b>' + esc(f[0]) + '</b> ' + esc(f[1]) + '</span>'; }).join('') + '</div>' : '') +
    (g ? '<div class="dex-got">' + (g.correct ? '정답' : pts(g.score) + ' · ' + g.rank + '번째로 가까움' + (g.km != null ? ' · ' + Number(g.km).toLocaleString('ko-KR') + ' km' : '')) + '</div>' : '') +
    (img && img.artist ? '<div class="dex-credit">사진 ' + esc(img.artist) + ' · ' + esc(img.license || '') + '</div>' : '') +
    '</div>';
}

