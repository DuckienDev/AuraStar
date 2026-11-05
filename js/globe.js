/* Aura Star — hero globe. The same satellite globe the app uses (MapLibre GL JS,
   globe projection, Esri World Imagery) with gold dashed connection arcs and
   glowing "moment" dots, auto-spinning in deep space. */
(function () {
  'use strict';
  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof maplibregl === 'undefined') return;

  var ESRI =
    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  var map = new maplibregl.Map({
    container: 'globe',
    attributionControl: false,
    interactive: true,
    dragRotate: false,
    pitchWithRotate: false,
    doubleClickZoom: false,
    scrollZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoomRotate: false,
    minZoom: 1.1,
    maxZoom: 2.4,
    center: [12, 22],
    zoom: 1.35,
    renderWorldCopies: false,
    style: {
      version: 8,
      sources: {
        sat: { type: 'raster', tiles: [ESRI], tileSize: 256, maxzoom: 8,
          attribution: '© Esri, Maxar, Earthstar Geographics' }
      },
      layers: [
        { id: 'space', type: 'background',
          paint: { 'background-color': 'rgba(0,0,0,0)' } },
        { id: 'sat', type: 'raster', source: 'sat',
          paint: { 'raster-fade-duration': 300 } }
      ],
      sky: {}
    }
  });

  // Great-circle arc between two [lng,lat] points.
  function gcArc(from, to, n) {
    var rad = Math.PI / 180, deg = 180 / Math.PI;
    var la1 = from[1] * rad, lo1 = from[0] * rad,
        la2 = to[1] * rad, lo2 = to[0] * rad;
    var d = 2 * Math.asin(Math.sqrt(
      Math.pow(Math.sin((la2 - la1) / 2), 2) +
      Math.cos(la1) * Math.cos(la2) * Math.pow(Math.sin((lo2 - lo1) / 2), 2)));
    if (!d) return [from, to];
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var f = i / n;
      var A = Math.sin((1 - f) * d) / Math.sin(d);
      var B = Math.sin(f * d) / Math.sin(d);
      var x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2);
      var y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2);
      var z = A * Math.sin(la1) + B * Math.sin(la2);
      pts.push([Math.atan2(y, x) * deg,
                Math.atan2(z, Math.sqrt(x * x + y * y)) * deg]);
    }
    return pts;
  }

  var CITIES = {
    hanoi: [105.83, 21.03], tokyo: [139.65, 35.68], sydney: [151.21, -33.87],
    singapore: [103.82, 1.35], mumbai: [72.88, 19.08], dubai: [55.27, 25.20],
    london: [-0.12, 51.51], paris: [2.35, 48.86], rome: [12.49, 41.89],
    cairo: [31.24, 30.04], newyork: [-74.0, 40.71], sf: [-122.42, 37.77],
    rio: [-43.21, -22.95], nairobi: [36.82, -1.29]
  };
  var PAIRS = [
    ['hanoi', 'tokyo'], ['hanoi', 'paris'], ['tokyo', 'sf'], ['london', 'newyork'],
    ['paris', 'cairo'], ['sydney', 'singapore'], ['dubai', 'mumbai'],
    ['newyork', 'rio'], ['london', 'nairobi'], ['sf', 'rio'], ['rome', 'dubai']
  ];

  map.on('load', function () {
    try { map.setProjection({ type: 'globe' }); } catch (e) {}
    try {
      // Soft white-blue atmosphere hugging the globe's limb.
      map.setSky({
        'sky-color': '#2d4f8f',
        'horizon-color': '#bcd8ff',
        'fog-color': '#e3eeff',
        'fog-ground-blend': 0.08,
        'horizon-fog-blend': 0.92,
        'sky-horizon-blend': 0.85,
        'atmosphere-blend': 1
      });
    } catch (e) {}

    // Thin atmosphere rim that ALWAYS hugs the globe — drawn on a canvas using
    // the globe's real on-screen centre + radius, so it lines up on any screen.
    var atmo = document.createElement('canvas');
    atmo.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;' +
      'pointer-events:none;z-index:3;';
    map.getContainer().appendChild(atmo);
    var actx = atmo.getContext('2d');
    var aw = 0, ah = 0, adpr = Math.min(window.devicePixelRatio || 1, 2);
    function globeRadius() {
      var t = map.transform;
      var ws = (t && t.worldSize) ? t.worldSize : (512 * Math.pow(2, map.getZoom()));
      return ws / (2 * Math.PI);
    }
    function drawAtmo() {
      var el = map.getContainer();
      var w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      if (w !== aw || h !== ah) {
        aw = w; ah = h;
        atmo.width = Math.floor(w * adpr); atmo.height = Math.floor(h * adpr);
        actx.setTransform(adpr, 0, 0, adpr, 0, 0);
      }
      actx.clearRect(0, 0, w, h);
      // Fixed at the container centre so the atmosphere stays put while the
      // Earth rotates underneath it (it must not drift with the drag).
      var c = { x: w / 2, y: h / 2 };
      var R = globeRadius();
      // Publish the globe's rotation so the starfield can parallax behind it.
      var gc = map.getCenter();
      window.__auraCenter = { lng: gc.lng, lat: gc.lat };
      // Glow straddles the limb (R*1.0): it bleeds a little onto the Earth's
      // edge and fades softly outward, so it hugs the surface with no gap.
      var g = actx.createRadialGradient(c.x, c.y, R * 0.90, c.x, c.y, R * 1.13);
      g.addColorStop(0.0, 'rgba(200,228,255,0)');
      g.addColorStop(0.30, 'rgba(198,226,255,0.35)'); // onto the Earth's edge
      g.addColorStop(0.44, 'rgba(206,233,255,0.72)'); // brightest right at the limb
      g.addColorStop(0.62, 'rgba(150,200,255,0.25)'); // just outside
      g.addColorStop(1.0, 'rgba(130,185,255,0)');     // soft hazy fade
      actx.globalCompositeOperation = 'lighter';
      actx.fillStyle = g;
      actx.beginPath(); actx.arc(c.x, c.y, R * 1.13, 0, Math.PI * 2); actx.fill();
    }
    map.on('render', drawAtmo);
    window.addEventListener('resize', drawAtmo);
    drawAtmo();

    // ---- Smooth horizontal turntable (custom drag + inertia) --------------
    // MapLibre's dragPan also changes latitude (→ the globe resizes near the
    // poles and the atmosphere breaks) and its easeTo spin stutters against the
    // lat reset. So we drive the rotation ourselves: one jumpTo per frame,
    // longitude only, latitude pinned — buttery smooth and always hugging.
    map.dragPan.disable();
    var LAT = map.getCenter().lat;
    var autoSpin = !reduce;
    var dragging = false, lastX = 0, vel = 0, idleTimer = null;
    var el = map.getContainer();
    el.style.touchAction = 'pan-y'; // let vertical swipes scroll the page
    el.style.cursor = 'grab';

    function setLng(lng) { map.jumpTo({ center: [lng, LAT] }); }

    function tick() {
      if (!dragging) {
        if (Math.abs(vel) > 0.004) {              // inertia after a fling
          setLng(map.getCenter().lng + vel);
          vel *= 0.95;
        } else if (autoSpin) {                     // gentle idle spin
          setLng(map.getCenter().lng - 0.05);
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    function onDown(e) {
      dragging = true; lastX = e.clientX; vel = 0;
      autoSpin = false; clearTimeout(idleTimer);
      el.style.cursor = 'grabbing';
    }
    function onMove(e) {
      if (!dragging) return;
      var dx = e.clientX - lastX; lastX = e.clientX;
      var dLng = -dx * (330 / Math.max(700, el.clientWidth));
      setLng(map.getCenter().lng + dLng);
      vel = dLng; // carry the last delta as fling velocity
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = 'grab';
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () { autoSpin = !reduce; }, 3000);
    }
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });

  map.on('error', function () { /* keep the page alive if tiles hiccup */ });
})();
