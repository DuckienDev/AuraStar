/* Aura Star — hero starfield: a lively sky of twinkling stars with occasional
   sparkles and shooting stars, behind the globe. */
(function () {
  'use strict';
  var canvas = document.getElementById('stars');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, stars = [], meteors = [], last = 0, nextMeteor = 1200;

  function resize() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.max(90, Math.floor((W * H) / 4200)); // more stars
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.5 + 0.45,
        tw: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random() * 1.6,
        spark: 0
      });
    }
  }

  function spawnMeteor() {
    var startX = W * (0.4 + Math.random() * 0.7);
    var len = 150 + Math.random() * 180;
    var ang = (Math.random() * 18 + 20) * Math.PI / 180;
    var sp = 8 + Math.random() * 5;
    meteors.push({
      x: startX, y: -20,
      vx: -Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
      len: len, life: 0, max: 55 + Math.random() * 30
    });
  }

  function frame(t) {
    if (!last) last = t;
    var dt = t - last; last = t;
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      // occasional sparkle flash
      if (!reduce) {
        if (s.spark > 0) s.spark -= dt;
        else if (Math.random() < 0.0012) s.spark = 420 + Math.random() * 260;
      }
      var base = reduce ? 0.7 : 0.5 + 0.5 * Math.abs(Math.sin(s.tw + t * 0.001 * s.sp));
      var sparkK = s.spark > 0 ? Math.sin((s.spark / 680) * Math.PI) : 0;
      var a = Math.min(1, base + sparkK * 0.5);
      var rad = s.r + sparkK * 1.2;

      // soft halo for brighter stars (a little glow)
      if (s.r > 1.05 || sparkK > 0.2) {
        ctx.globalAlpha = a * 0.25;
        ctx.fillStyle = '#cfe0ff';
        ctx.beginPath(); ctx.arc(s.x, s.y, rad * 2.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(s.x, s.y, rad, 0, Math.PI * 2); ctx.fill();

      // 4-point sparkle cross at peak
      if (sparkK > 0.35) {
        ctx.globalAlpha = (sparkK - 0.35) * 1.1;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
        var L = rad * 4.5;
        ctx.beginPath();
        ctx.moveTo(s.x - L, s.y); ctx.lineTo(s.x + L, s.y);
        ctx.moveTo(s.x, s.y - L); ctx.lineTo(s.x, s.y + L);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    if (!reduce) {
      nextMeteor -= dt;
      if (nextMeteor <= 0) { spawnMeteor(); nextMeteor = 2400 + Math.random() * 3000; }
      for (var m = meteors.length - 1; m >= 0; m--) {
        var me = meteors[m];
        me.life++; me.x += me.vx; me.y += me.vy;
        var hyp = Math.hypot(me.vx, me.vy);
        var tx = me.x - me.vx / hyp * me.len;
        var ty = me.y - me.vy / hyp * me.len;
        var fade = Math.min(1, me.life / 8) * Math.max(0, 1 - me.life / me.max);
        var grad = ctx.createLinearGradient(me.x, me.y, tx, ty);
        grad.addColorStop(0, 'rgba(255,235,195,' + (0.98 * fade) + ')');
        grad.addColorStop(0.4, 'rgba(255,184,77,' + (0.55 * fade) + ')');
        grad.addColorStop(1, 'rgba(255,184,77,0)');
        ctx.strokeStyle = grad; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(me.x, me.y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.globalAlpha = fade; ctx.fillStyle = '#fff6e0';
        ctx.beginPath(); ctx.arc(me.x, me.y, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        if (me.life > me.max || me.x < -100 || me.y > H + 100) meteors.splice(m, 1);
      }
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
