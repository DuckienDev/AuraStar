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
      map.setSky({
        'sky-color': '#0a1836', 'horizon-color': '#1b2b57',
        'fog-color': '#05080f', 'fog-ground-blend': 0.5,
        'horizon-fog-blend': 0.6, 'sky-horizon-blend': 0.8, 'atmosphere-blend': 0.9
      });
    } catch (e) {}

    var arcs = PAIRS.map(function (p) {
      return { type: 'Feature',
        geometry: { type: 'LineString', coordinates: gcArc(CITIES[p[0]], CITIES[p[1]], 64) } };
    });
    var dots = Object.keys(CITIES).map(function (k) {
      return { type: 'Feature', geometry: { type: 'Point', coordinates: CITIES[k] } };
    });

    map.addSource('arcs', { type: 'geojson', lineMetrics: true,
      data: { type: 'FeatureCollection', features: arcs } });
    map.addLayer({ id: 'arc-glow', type: 'line', source: 'arcs',
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': '#FFB84D', 'line-width': 5, 'line-opacity': 0.12, 'line-blur': 4 } });
    map.addLayer({ id: 'arc', type: 'line', source: 'arcs',
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': '#FFD08A', 'line-width': 1.6, 'line-opacity': 0.95,
        'line-dasharray': [1.5, 1.5] } });

    map.addSource('dots', { type: 'geojson',
      data: { type: 'FeatureCollection', features: dots } });
    map.addLayer({ id: 'dot-glow', type: 'circle', source: 'dots',
      paint: { 'circle-color': '#FFB84D', 'circle-radius': 9, 'circle-blur': 1, 'circle-opacity': 0.5 } });
    map.addLayer({ id: 'dot', type: 'circle', source: 'dots',
      paint: { 'circle-color': '#FFE3B0', 'circle-radius': 3,
        'circle-stroke-color': '#FFB84D', 'circle-stroke-width': 1.4 } });

    // Flowing "ant-path" dash animation on the arcs.
    if (!reduce) {
      var steps = [[0,4,3],[1,4,2,1],[2,4,1,2],[3,4,0,3],[0,1,3,3],[0,2,3,2],[0,3,3,1]];
      var si = 0;
      setInterval(function () {
        si = (si + 1) % steps.length;
        if (map.getLayer('arc')) map.setPaintProperty('arc', 'line-dasharray', steps[si]);
      }, 90);
    }

    // Gentle auto-spin until the visitor grabs it; resumes after release.
    var spinning = !reduce, idle;
    function spin() {
      if (!spinning) return;
      var c = map.getCenter();
      c.lng -= 0.18;
      map.easeTo({ center: c, duration: 1000, easing: function (t) { return t; } });
    }
    map.on('moveend', function () { if (spinning) spin(); });
    function pause() { spinning = false; clearTimeout(idle); }
    function resume() { clearTimeout(idle); idle = setTimeout(function () {
      spinning = !reduce; spin(); }, 2600); }
    map.on('mousedown', pause); map.on('touchstart', pause);
    map.on('dragstart', pause);
    map.on('mouseup', resume); map.on('touchend', resume); map.on('dragend', resume);
    map.dragPan.enable();
    if (spinning) spin();
  });

  map.on('error', function () { /* keep the page alive if tiles hiccup */ });
})();
