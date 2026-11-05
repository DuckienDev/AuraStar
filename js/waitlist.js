/* Aura Star — waitlist signup. Posts the email to a Supabase table that only
   accepts inserts (the publishable key is public-safe; row-level security keeps
   the list private). Bilingual button feedback. */
(function () {
  'use strict';
  var SUPABASE_URL = 'https://tlapaaeuyvwdyctlengh.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_jywqXA6S_G2BUnc8xh7-nQ_ZhMUbyXp';

  var form = document.querySelector('.signup');
  var btn = document.getElementById('notify');
  var input = document.getElementById('email');
  if (!form || !btn || !input) return;

  function lang() { return document.documentElement.lang === 'vi' ? 'vi' : 'en'; }
  var MSG = {
    idle:    { en: 'Notify me ✦',          vi: 'Báo cho tôi ✦' },
    sending: { en: 'Sending…',             vi: 'Đang gửi…' },
    saved:   { en: 'Thanks ✦',             vi: 'Đã ghi nhận ✦' },
    already: { en: "You're on the list ✦", vi: 'Bạn đã có trong danh sách ✦' },
    invalid: { en: 'Enter a valid email',  vi: 'Nhập email hợp lệ' },
    error:   { en: 'Try again later',      vi: 'Thử lại sau' }
  };
  function set(key, disabled) { btn.textContent = MSG[key][lang()]; btn.disabled = !!disabled; }
  function resetSoon() { setTimeout(function () { set('idle', false); }, 3000); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = (input.value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { set('invalid', false); resetSoon(); return; }
    set('sending', true);
    fetch(SUPABASE_URL + '/rest/v1/waitlist', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ email: email, source: 'web' })
    }).then(function (r) {
      if (r.status === 409) { set('already', true); input.value = ''; }
      else if (r.ok || r.status === 201) { set('saved', true); input.value = ''; }
      else { set('error', false); }
      resetSoon();
    }).catch(function () { set('error', false); resetSoon(); });
  });
})();
