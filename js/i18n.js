/* Aura Star — lightweight client-side i18n (no framework) */
(function () {
  "use strict";

  var STORAGE_KEY = "as_lang";
  var SUPPORTED = ["en", "vi"];

  function getStored() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return SUPPORTED.indexOf(v) !== -1 ? v : null;
    } catch (e) {
      return null;
    }
  }

  function setStored(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* ignore (private mode, blocked storage) */
    }
  }

  function detectDefault() {
    var nav = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    return nav.indexOf("vi") === 0 ? "vi" : "en";
  }

  function apply(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = "en";

    // Text / HTML content
    var els = document.querySelectorAll("[data-en], [data-vi]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var val = el.getAttribute("data-" + lang);
      if (val === null) val = el.getAttribute("data-en"); // fallback
      if (val !== null) el.innerHTML = val;
    }

    // Input placeholders
    var phEls = document.querySelectorAll("[data-ph-en], [data-ph-vi]");
    for (var j = 0; j < phEls.length; j++) {
      var p = phEls[j];
      var ph = p.getAttribute("data-ph-" + lang);
      if (ph === null) ph = p.getAttribute("data-ph-en");
      if (ph !== null) p.setAttribute("placeholder", ph);
    }

    document.documentElement.lang = lang;

    // Toggle active state on language buttons
    var btns = document.querySelectorAll(".lang-btn");
    for (var k = 0; k < btns.length; k++) {
      var b = btns[k];
      if (b.getAttribute("data-lang") === lang) {
        b.classList.add("active");
        b.setAttribute("aria-pressed", "true");
      } else {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      }
    }
  }

  function wire(current) {
    var btns = document.querySelectorAll(".lang-btn");
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          var lang = btn.getAttribute("data-lang");
          if (SUPPORTED.indexOf(lang) === -1) return;
          setStored(lang);
          apply(lang);
        });
      })(btns[i]);
    }
  }

  function init() {
    var lang = getStored() || detectDefault();
    apply(lang);
    wire(lang);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
