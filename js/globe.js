/* Aura Star — interactive hero globe (three.js, single CDN dep) */
(function () {
  "use strict";

  var canvas = document.getElementById("globe");
  if (!canvas || typeof THREE === "undefined") {
    if (canvas) canvas.style.display = "none";
    return;
  }

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Palette ----
  var GOLD = new THREE.Color(0xffb84d);
  var GOLD_SOFT = new THREE.Color(0xffd08a);
  var DOT_BLUE = new THREE.Color(0x4f6fae);

  var R = 1.0; // globe radius

  // ---- Renderer / scene / camera ----
  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.35, 3.25);
  camera.lookAt(0, 0, 0);

  // Group that holds everything that rotates (globe + arcs + dots)
  var world = new THREE.Group();
  world.rotation.z = THREE.MathUtils.degToRad(-16); // slight axial tilt
  scene.add(world);

  var globe = new THREE.Group();
  world.add(globe);

  // ---- Round sprite texture for dots ----
  function makeDiscTexture() {
    var s = 64;
    var c = document.createElement("canvas");
    c.width = c.height = s;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    var t = new THREE.CanvasTexture(c);
    return t;
  }
  var disc = makeDiscTexture();

  // ---- Fibonacci-sphere dotted globe ----
  function fib(n) {
    var pts = [];
    var off = 2 / n;
    var inc = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < n; i++) {
      var y = i * off - 1 + off / 2;
      var r = Math.sqrt(1 - y * y);
      var phi = i * inc;
      pts.push(new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r));
    }
    return pts;
  }

  var N = reduceMotion ? 1400 : 2600;
  var base = fib(N);
  var posArr = new Float32Array(N * 3);
  var colArr = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) {
    var p = base[i];
    posArr[i * 3] = p.x * R;
    posArr[i * 3 + 1] = p.y * R;
    posArr[i * 3 + 2] = p.z * R;
    // ~7% of dots are gold accents (like posts scattered on the map)
    var gold = Math.random() < 0.07;
    var c = gold ? GOLD_SOFT : DOT_BLUE;
    var jitter = 0.65 + Math.random() * 0.35;
    colArr[i * 3] = c.r * jitter;
    colArr[i * 3 + 1] = c.g * jitter;
    colArr[i * 3 + 2] = c.b * jitter;
  }
  var dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
  dotGeo.setAttribute("color", new THREE.BufferAttribute(colArr, 3));
  var dotMat = new THREE.PointsMaterial({
    size: 0.028,
    map: disc,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });
  var dots = new THREE.Points(dotGeo, dotMat);
  globe.add(dots);

  // ---- Solid inner sphere so far-side dots are gently occluded ----
  var inner = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.985, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x070c1a })
  );
  globe.add(inner);

  // ---- Atmosphere glow (fresnel, additive, back side) ----
  var atmMat = new THREE.ShaderMaterial({
    uniforms: {
      glow: { value: new THREE.Color(0xffc266) },
      rim: { value: new THREE.Color(0x5aa0ff) },
    },
    vertexShader:
      "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);}",
    fragmentShader:
      "uniform vec3 glow; uniform vec3 rim; varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); vec3 col = mix(rim, glow, clamp(i,0.0,1.0)); gl_FragColor = vec4(col, 1.0) * clamp(i,0.0,1.0); }",
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  var atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.28, 48, 48),
    atmMat
  );
  world.add(atmosphere);

  // ---- Starfield (drifting background) ----
  var starGroup = new THREE.Group();
  scene.add(starGroup);
  (function makeStars() {
    var SN = reduceMotion ? 700 : 1600;
    var sp = new Float32Array(SN * 3);
    var sc = new Float32Array(SN * 3);
    for (var i = 0; i < SN; i++) {
      // shell between r 6 and 18
      var v = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      );
      if (v.length() < 0.001) v.set(1, 0, 0);
      v.normalize().multiplyScalar(6 + Math.random() * 12);
      sp[i * 3] = v.x;
      sp[i * 3 + 1] = v.y;
      sp[i * 3 + 2] = v.z;
      var warm = Math.random() < 0.25;
      var c = warm ? GOLD_SOFT : new THREE.Color(0xbfd0ff);
      var b = 0.4 + Math.random() * 0.6;
      sc[i * 3] = c.r * b;
      sc[i * 3 + 1] = c.g * b;
      sc[i * 3 + 2] = c.b * b;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    g.setAttribute("color", new THREE.BufferAttribute(sc, 3));
    var m = new THREE.PointsMaterial({
      size: 0.08,
      map: disc,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    starGroup.add(new THREE.Points(g, m));
  })();

  // ---- Pulsing post dots on the surface ----
  var pulses = [];
  (function makePulses() {
    var count = reduceMotion ? 10 : 22;
    for (var i = 0; i < count; i++) {
      var p = base[Math.floor(Math.random() * base.length)]
        .clone()
        .multiplyScalar(R * 1.012);
      var mat = new THREE.SpriteMaterial({
        map: disc,
        color: Math.random() < 0.5 ? GOLD : GOLD_SOFT,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      var s = new THREE.Sprite(mat);
      s.position.copy(p);
      var sc = 0.05 + Math.random() * 0.04;
      s.scale.set(sc, sc, sc);
      s.userData = { base: sc, phase: Math.random() * Math.PI * 2, speed: 0.8 + Math.random() * 1.2 };
      globe.add(s);
      pulses.push(s);
    }
  })();

  // ---- Gold connection arcs ----
  var SEG = 64;
  var arcs = [];

  function randSurface() {
    return base[Math.floor(Math.random() * base.length)].clone();
  }

  function buildArc() {
    var a = randSurface();
    var b = randSurface();
    while (a.distanceTo(b) < 0.9) b = randSurface();
    var mid = a.clone().add(b).multiplyScalar(0.5);
    var lift = 1 + 0.45 * a.distanceTo(b); // higher lift for longer arcs
    mid.normalize().multiplyScalar(R * lift);
    var curve = new THREE.QuadraticBezierCurve3(
      a.clone().multiplyScalar(R * 1.01),
      mid,
      b.clone().multiplyScalar(R * 1.01)
    );
    var pts = curve.getPoints(SEG);
    var arr = new Float32Array((SEG + 1) * 3);
    for (var i = 0; i <= SEG; i++) {
      arr[i * 3] = pts[i].x;
      arr[i * 3 + 1] = pts[i].y;
      arr[i * 3 + 2] = pts[i].z;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    var mat = new THREE.LineBasicMaterial({
      color: GOLD,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    var line = new THREE.Line(geo, mat);
    geo.setDrawRange(0, 0);
    globe.add(line);

    // traveling head sprite
    var headMat = new THREE.SpriteMaterial({
      map: disc,
      color: GOLD_SOFT,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    var head = new THREE.Sprite(headMat);
    head.scale.set(0.07, 0.07, 0.07);
    globe.add(head);

    return {
      line: line,
      mat: mat,
      head: head,
      curve: curve,
      state: "grow",
      t: 0,
      hold: 0,
      speed: 0.35 + Math.random() * 0.35,
    };
  }

  var ARC_COUNT = reduceMotion ? 4 : 6;
  for (var k = 0; k < ARC_COUNT; k++) arcs.push(buildArc());

  function respawn(idx) {
    var old = arcs[idx];
    globe.remove(old.line);
    globe.remove(old.head);
    old.line.geometry.dispose();
    old.mat.dispose();
    arcs[idx] = buildArc();
  }

  function updateArc(arc, idx, dt) {
    if (arc.state === "grow") {
      arc.t += dt * arc.speed;
      var count = Math.floor(Math.min(arc.t, 1) * (SEG + 1));
      arc.line.geometry.setDrawRange(0, count);
      var ht = Math.min(arc.t, 1);
      arc.head.position.copy(arc.curve.getPoint(ht));
      arc.head.material.opacity = 0.9 * (1 - ht) + 0.2;
      if (arc.t >= 1) {
        arc.state = "hold";
        arc.hold = 0;
        arc.head.material.opacity = 0;
      }
    } else if (arc.state === "hold") {
      arc.hold += dt;
      if (arc.hold > 1.6) arc.state = "fade";
    } else if (arc.state === "fade") {
      arc.mat.opacity -= dt * 0.9;
      if (arc.mat.opacity <= 0) respawn(idx);
    }
  }

  // ---- Pointer drag interaction ----
  var dragging = false;
  var last = { x: 0, y: 0 };
  var spin = { x: 0, y: 0 };
  var autoSpeed = reduceMotion ? 0 : 0.055;

  function onDown(e) {
    dragging = true;
    var p = e.touches ? e.touches[0] : e;
    last.x = p.clientX;
    last.y = p.clientY;
  }
  function onMove(e) {
    if (!dragging) return;
    var p = e.touches ? e.touches[0] : e;
    var dx = p.clientX - last.x;
    var dy = p.clientY - last.y;
    last.x = p.clientX;
    last.y = p.clientY;
    spin.y += dx * 0.005;
    spin.x += dy * 0.005;
    spin.x = Math.max(-0.6, Math.min(0.6, spin.x));
  }
  function onUp() {
    dragging = false;
  }
  canvas.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  canvas.addEventListener("touchstart", onDown, { passive: true });
  canvas.addEventListener("touchmove", onMove, { passive: true });
  canvas.addEventListener("touchend", onUp);

  // ---- Resize ----
  function resize() {
    var w = canvas.clientWidth || canvas.parentElement.clientWidth;
    var h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);

  // ---- Animation loop ----
  var clock = new THREE.Clock();
  function animate() {
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;

    world.rotation.y += autoSpeed * dt + spin.y;
    world.rotation.x += spin.x;
    world.rotation.x = Math.max(-0.5, Math.min(0.5, world.rotation.x));
    spin.y *= 0.9;
    spin.x *= 0.9;

    starGroup.rotation.y += 0.004 * dt;
    starGroup.rotation.x = 0.1;

    if (!reduceMotion) {
      for (var i = 0; i < pulses.length; i++) {
        var pu = pulses[i].userData;
        var s = pu.base * (1 + 0.5 * Math.sin(t * pu.speed + pu.phase));
        pulses[i].scale.set(s, s, s);
        pulses[i].material.opacity = 0.55 + 0.45 * Math.sin(t * pu.speed + pu.phase);
      }
      for (var j = 0; j < arcs.length; j++) updateArc(arcs[j], j, dt);
    } else {
      // static: show arcs fully drawn once
      for (var m = 0; m < arcs.length; m++) {
        arcs[m].line.geometry.setDrawRange(0, SEG + 1);
        arcs[m].head.material.opacity = 0;
      }
    }

    renderer.render(scene, camera);
    if (!reduceMotion) requestAnimationFrame(animate);
  }

  resize();
  // a couple of resize retries for late layout
  setTimeout(resize, 60);
  setTimeout(resize, 300);

  if (reduceMotion) {
    // render a few frames so arcs populate, then stop
    animate();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        resize();
        animate();
      });
    });
  } else {
    requestAnimationFrame(animate);
  }
})();
