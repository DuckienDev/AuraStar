/* Aura Star — hero starfield: a few faint twinkling stars on a black sky, with
   the occasional shooting star streaking by. Sits behind the globe. */
(function () {
  'use strict';
  var canvas = document.getElementById('stars');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, stars = [], meteors = [], last = 0, nextMeteor = 1600;

  function resize() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.max(40, Math.floor((W * H) / 9000));
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.3 + 0.3,
        tw: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random() * 1.4
      });
    }
  }

  function spawnMeteor() {
    // Enter from the top edge, travel down-left (like the app's gold comet).
    var startX = W * (0.45 + Math.random() * 0.6);
    var len = 140 + Math.random() * 160;
    var ang = (Math.random() * 18 + 20) * Math.PI / 180; // 20–38° below horizon
    meteors.push({
      x: startX, y: -20,
      vx: -Math.cos(ang) * (7 + Math.random() * 4),
      vy: Math.sin(ang) * (7 + Math.random() * 4),
      len: len, life: 0, max: 60 + Math.random() * 30
    });
  }

  function frame(t) {
    if (!last) last = t;
    var dt = t - last; last = t;
    ctx.clearRect(0, 0, W, H);

    // Stars
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = reduce ? 0.6 : 0.35 + 0.55 * Math.abs(Math.sin(s.tw + t * 0.001 * s.sp));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (!reduce) {
      // Shooting stars
      nextMeteor -= dt;
      if (nextMeteor <= 0) { spawnMeteor(); nextMeteor = 4200 + Math.random() * 5200; }
      for (var m = meteors.length - 1; m >= 0; m--) {
        var me = meteors[m];
        me.life++;
        me.x += me.vx; me.y += me.vy;
        var tx = me.x - me.vx / Math.hypot(me.vx, me.vy) * me.len;
        var ty = me.y - me.vy / Math.hypot(me.vx, me.vy) * me.len;
        var fade = Math.min(1, me.life / 8) * Math.max(0, 1 - me.life / me.max);
        var grad = ctx.createLinearGradient(me.x, me.y, tx, ty);
        grad.addColorStop(0, 'rgba(255,230,180,' + (0.95 * fade) + ')');
        grad.addColorStop(0.4, 'rgba(255,184,77,' + (0.5 * fade) + ')');
        grad.addColorStop(1, 'rgba(255,184,77,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(me.x, me.y); ctx.lineTo(tx, ty);
        ctx.stroke();
        // bright head
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#fff6e0';
        ctx.beginPath(); ctx.arc(me.x, me.y, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        if (me.life > me.max || me.x < -80 || me.y > H + 80) meteors.splice(m, 1);
      }
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
