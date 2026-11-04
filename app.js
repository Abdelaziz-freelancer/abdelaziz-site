(function () {
  'use strict';
  var C = window.APP_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var get = function (o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); };
  var ready = C.SUPABASE_URL && C.SUPABASE_ANON_KEY && !/PASTE|YOUR/i.test(C.SUPABASE_URL + C.SUPABASE_ANON_KEY);
  var T = ['', 't2', 't3', 't4', 't5'];

  function authHeaders() { var h = { apikey: C.SUPABASE_ANON_KEY }; if (/^eyJ/.test(C.SUPABASE_ANON_KEY)) h.Authorization = 'Bearer ' + C.SUPABASE_ANON_KEY; return h; }
  function q(p) {
    return fetch(C.SUPABASE_URL + '/rest/v1/' + p, { headers: authHeaders() })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  async function load() {
    var D = await fetch('defaults.json').then(function (r) { return r.json(); }).catch(function () { return {}; });
    if (ready) {
      try {
        var a = await Promise.all([
          q('site_content?select=key,value'),
          q('results?visible=eq.true&order=position'),
          q('reviews?visible=eq.true&order=position'),
          q('client_logos?visible=eq.true&order=position'),
          q('ticker_items?visible=eq.true&order=position')
        ]);
        a[0].forEach(function (r) { D[r.key] = r.value; });
        D.results = a[1]; D.reviews = a[2]; D.logos = a[3]; D.ticker = a[4];
      } catch (e) { console.warn('using default content', e); }
    }
    return D;
  }
  function im(url, i, alt) {
    return '<div class="im ' + T[i % 5] + (url ? ' has' : '') + '">' + (url ? '<img src="' + esc(url) + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async">' : '') + '</div>';
  }
  function svg(p) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; }
  var ICONS = {
    whatsapp: svg('<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20l1.2-5.4A8.4 8.4 0 1 1 21 11.5z"/>'),
    facebook: svg('<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5A.5.5 0 0 1 14 8z"/>'),
    instagram: svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/>'),
    tiktok: svg('<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.4 2.6 2 4 5 4.2"/>'),
    linkedin: svg('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-7m0 3a3 3 0 0 1 6 0v4"/>'),
    email: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>')
  };
  var NAMES = { whatsapp: 'واتساب', facebook: 'فيسبوك', instagram: 'إنستجرام', tiktok: 'تيك توك', linkedin: 'لينكدإن', email: 'البريد الإلكتروني' };
  function wa(v) { var d = String(v).replace(/\D/g, ''); if (/^0\d{10}$/.test(d)) d = '20' + d.slice(1); return 'https://wa.me/' + d; }
  function href(k, v) {
    v = String(v).trim();
    if (k === 'email') return 'mailto:' + v;
    if (k === 'whatsapp') return wa(v);
    return /^https?:\/\//i.test(v) ? v : 'https://' + v.replace(/^\/+/, '');
  }
  function marquee(el, items, rev, speed) {
    if (!items.length) { el.hidden = true; return; }
    var iw = window.innerWidth <= 760 ? 206 : 266;
    var k = Math.max(1, Math.ceil(window.innerWidth * 1.2 / (items.length * iw)));
    var half = '';
    for (var n = 0; n < k; n++) items.forEach(function (it, i) { half += '<div class="ti ' + 'im ' + T[i % 5] + (it.image_url ? ' has' : '') + '">' + (it.image_url ? '<img src="' + esc(it.image_url) + '" alt="" loading="lazy" decoding="async">' : '') + '</div>'; });
    var dur = Math.max(12, (Number(speed) || 36) * items.length * k / 8);
    el.innerHTML = '<div class="tk' + (rev ? ' r' : '') + '" style="animation-duration:' + dur + 's">' + half + '<div style="display:contents" aria-hidden="true">' + half + '</div></div>';
  }
  function render(D) {
    var S = D.settings || {};
    document.title = S.seo_title || document.title;
    var md = $('meta[name=description]'); if (md && S.seo_desc) md.setAttribute('content', S.seo_desc);
    $$('[data-b]').forEach(function (el) { var v = get(D, el.getAttribute('data-b')); if (v != null && v !== '') el.textContent = v; });
    $('#navcta').hidden = !S.show_nav_cta; $('#herocta').hidden = !S.show_hero_cta;
    var h = D.hero || {};
    $('#stats').innerHTML = (h.stats || []).map(function (s) { return '<div><b>' + esc(s.v) + '</b><span>' + esc(s.l) + '</span></div>'; }).join('');
    if (h.photo) { var ph = $('#photo'); ph.innerHTML = '<img src="' + esc(h.photo) + '" alt="' + esc(S.site_name || '') + '">'; ph.classList.add('has'); }

    var R = D.results || [], cats = [];
    R.forEach(function (r) { if (r.category && cats.indexOf(r.category) < 0) cats.push(r.category); });
    var tabs = [{ c: '', l: (D.results_head || {}).all || 'الكل' }].concat(cats.map(function (c) { return { c: c, l: c }; }));
    $('#rtabs').innerHTML = tabs.map(function (t, i) { return '<button type="button" data-c="' + esc(t.c) + '" aria-pressed="' + (i === 0) + '">' + esc(t.l) + '</button>'; }).join('');
    $('#rtabs').hidden = cats.length < 2;
    $('#rgrid').innerHTML = R.map(function (r, i) {
      return '<div class="cd" data-c="' + esc(r.category) + '">' + im(r.image_url, i, r.title) + '<span class="tg">' + esc([r.category, r.platform].filter(Boolean).join(' · ')) + '</span><h3>' + esc(r.title) + '</h3>' +
        '<div class="sg"><div class="sx">الإنفاق<b>' + esc(r.spend) + '</b></div><div class="sx">المبيعات<b>' + esc(r.sales) + '</b></div><div class="sx g">ROAS<b>' + esc(r.roas) + '</b></div></div></div>';
    }).join('');
    $('#rtabs').onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $$('#rtabs button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      $$('#rgrid .cd').forEach(function (c) { c.hidden = !!b.getAttribute('data-c') && c.getAttribute('data-c') !== b.getAttribute('data-c'); });
      if (window.AOS && AOS.refresh) AOS.refresh();
    };

    var W = D.why || {};
    $('#reasons').innerHTML = (W.reasons || []).map(function (r) { return '<div class="li"><span class="n">✓</span><span><b>' + esc(r.t) + '</b>' + esc(r.d) + '</span></div>'; }).join('');
    $('#delivs').innerHTML = (W.deliverables || []).map(function (r, i) { return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(r.t) + '</summary><p>' + esc(r.d) + '</p></details>'; }).join('');
    $('#steps').innerHTML = ((D.brief_intro || {}).steps || []).map(function (r, i) { return '<div class="li"' + (i === 0 ? ' style="border-top:0"' : '') + '><span class="n">' + (i + 1) + '</span><span><b>' + esc(r.t) + '</b>' + esc(r.d) + '</span></div>'; }).join('');

    $('#logos').innerHTML = (D.logos || []).map(function (l, i) { return '<span class="cl im ' + T[i % 5] + (l.image_url ? ' has' : '') + '">' + (l.image_url ? '<img src="' + esc(l.image_url) + '" alt="' + esc(l.name) + '" loading="lazy" decoding="async">' : '') + '</span>'; }).join('');
    $('#logos').hidden = !(D.logos || []).length;
    $('#rvgrid').innerHTML = (D.reviews || []).map(function (r, i) { return '<figure class="fg">' + im(r.image_url, i, r.name) + '<figcaption>' + esc([r.name, r.business].filter(Boolean).join(' · ')) + '</figcaption></figure>'; }).join('');

    var tk = D.ticker || [], sp = (D.ticker_head || {}).speed;
    marquee($('#mq1'), tk.filter(function (x) { return x.lane === 1; }), false, sp);
    marquee($('#mq2'), tk.filter(function (x) { return x.lane === 2; }), true, sp);

    var K = D.contact || {}, keys = Object.keys(NAMES), set = keys.filter(function (k) { return K[k] && String(K[k]).trim(); });
    $('#contacts').innerHTML = (set.length ? set : keys).map(function (k) {
      var inner = '<u>' + ICONS[k] + '</u><span>' + NAMES[k] + (set.length ? '' : '<small>قريباً</small>') + '</span>';
      return set.length ? '<a class="ct" target="_blank" rel="noopener" href="' + esc(href(k, K[k])) + '">' + inner + '</a>' : '<div class="ct">' + inner + '</div>';
    }).join('');
    var w = $('#wa'); if (K.whatsapp && String(K.whatsapp).trim()) { w.href = wa(K.whatsapp); w.hidden = false; }
    if (window.AOS && AOS.refresh) AOS.refresh();
  }
  function chrome() {
    var root = document.documentElement, bar = $('.spb'), nav = $('.nav'), ticking = false;
    function onS() { ticking = false; var h = root.scrollHeight - window.innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')'; nav.classList.toggle('sc', window.scrollY > 20); }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onS); } }, { passive: true }); onS();
    var mb = $('#mb'), nl = $('#nl');
    function closeMenu() { nl.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); }
    mb.addEventListener('click', function () { var o = nl.classList.toggle('open'); mb.setAttribute('aria-expanded', String(o)); });
    nl.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.nav')) closeMenu(); });
  }
  chrome();
  load().then(render);
})();
