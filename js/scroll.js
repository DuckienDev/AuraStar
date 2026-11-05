/* Aura Star — scroll-reveal. Sections and cards rise, fade and un-tilt into
   place as they enter the viewport, with a staggered 3D feel. */
(function () {
  'use strict';
  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function run() {
    var els = document.querySelectorAll('.reveal');
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });

    // Subtle parallax drift on the phone mockups while they're in view.
    if (!reduce) {
      var phones = [].slice.call(document.querySelectorAll('.screens .phone'));
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var vh = window.innerHeight;
          phones.forEach(function (p, i) {
            var r = p.getBoundingClientRect();
            if (r.bottom < 0 || r.top > vh) return;
            var prog = (r.top + r.height / 2 - vh / 2) / vh; // -0.5..0.5
            var dir = (i % 2 === 0) ? 1 : -1;
            p.style.setProperty('--py', (prog * -18 * dir).toFixed(1) + 'px');
          });
          ticking = false;
        });
      }, { passive: true });
    }
  }

  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run);
})();
