/* Aura Star — account-deletion request. Posts the email to a Supabase table
   that only accepts inserts (publishable key is public-safe; row-level security
   keeps the list private — review requests in the dashboard). Bilingual. */
(function () {
  'use strict';
  var SUPABASE_URL = 'https://tlapaaeuyvwdyctlengh.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_jywqXA6S_G2BUnc8xh7-nQ_ZhMUbyXp';

  var form = document.getElementById('del-form');
  var btn = document.getElementById('del-btn');
  var input = document.getElementById('del-email');
  var note = document.getElementById('del-note');
  var msg = document.getElementById('del-msg');
  if (!form || !btn || !input) return;

  function lang() { return document.documentElement.lang === 'vi' ? 'vi' : 'en'; }
  var BTN = {
    idle:    { en: 'Request deletion', vi: 'Gửi yêu cầu xóa' },
    sending: { en: 'Sending…',         vi: 'Đang gửi…' }
  };
  var MSG = {
    saved:   { en: "Request received. We'll process it within 30 days and may email you to verify.",
               vi: 'Đã nhận yêu cầu. Chúng tôi sẽ xử lý trong vòng 30 ngày và có thể gửi email để xác minh.' },
    invalid: { en: 'Please enter a valid email address.', vi: 'Vui lòng nhập địa chỉ email hợp lệ.' },
    error:   { en: 'Something went wrong. Please email support@aurastar.app instead.',
               vi: 'Có lỗi xảy ra. Vui lòng gửi email tới support@aurastar.app.' }
  };
  function say(key, ok) {
    msg.textContent = MSG[key][lang()];
    msg.className = 'delreq-msg ' + (ok ? 'ok' : 'err');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = (input.value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say('invalid', false); return; }
    btn.textContent = BTN.sending[lang()]; btn.disabled = true;
    fetch(SUPABASE_URL + '/rest/v1/deletion_requests', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ email: email, note: (note && note.value.trim()) || null })
    }).then(function (r) {
      if (r.ok || r.status === 201) {
        say('saved', true);
        form.reset();
        btn.disabled = true;
        btn.textContent = BTN.idle[lang()];
      } else {
        say('error', false);
        btn.disabled = false; btn.textContent = BTN.idle[lang()];
      }
    }).catch(function () {
      say('error', false);
      btn.disabled = false; btn.textContent = BTN.idle[lang()];
    });
  });
})();
