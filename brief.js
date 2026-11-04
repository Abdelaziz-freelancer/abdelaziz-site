(function () {
  'use strict';
  var C = window.APP_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ready = C.SUPABASE_URL && C.SUPABASE_ANON_KEY && !/PASTE|YOUR/i.test(C.SUPABASE_URL + C.SUPABASE_ANON_KEY);
  var DRAFT = 'brief_draft_v1', secs = [], INPUTS = [];
  var json = function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); };
  function req(p, o) {
    o = o || {}; var h = { apikey: C.SUPABASE_ANON_KEY }; if (/^eyJ/.test(C.SUPABASE_ANON_KEY)) h.Authorization = 'Bearer ' + C.SUPABASE_ANON_KEY; o.headers = Object.assign(h, o.headers || {});
    return fetch(C.SUPABASE_URL + '/rest/v1/' + p, o);
  }
  async function loadSections() {
    if (ready) {
      try {
        var a = await Promise.all([req('brief_sections?select=*&order=position').then(json), req('brief_questions?select=*&order=position').then(json)]);
        return a[0].map(function (s) { s.questions = a[1].filter(function (x) { return x.section_id === s.id; }); return s; });
      } catch (e) { console.warn('using default brief', e); }
    }
    return fetch('brief-default.json').then(json).then(function (d) { return d.sections; });
  }
  var MULTI = ['radio', 'checkbox', 'multitext'];
  function field(x) {
    if (x.type === 'info') return '<div class="ib ' + esc(x.variant) + ' full"><b>' + esc(x.label) + '</b> ' + esc(x.hint) + '</div>';
    var id = 'q_' + x.id, multi = MULTI.indexOf(x.type) > -1, full = x.width === 'full' || multi || x.type === 'area';
    var lb = '<label class="lb" ' + (multi ? 'id="l_' + x.id + '"' : 'for="' + id + '"') + '>' + esc(x.label) + (x.required ? '<em>مطلوب</em>' : '') + '</label>';
    var body;
    if (x.type === 'area') body = '<textarea class="in" id="' + id + '" rows="3" placeholder="' + esc(x.placeholder) + '"></textarea>';
    else if (x.type === 'radio' || x.type === 'checkbox') body = '<div class="og" role="group" aria-labelledby="l_' + x.id + '">' + (x.options || []).map(function (o) { return '<label class="op"><input type="' + x.type + '" name="' + id + '" value="' + esc(o) + '"><span>' + esc(o) + '</span></label>'; }).join('') + '</div>';
    else if (x.type === 'multitext') body = (x.options || []).map(function (p, i) { return '<div class="nf"><b>' + (i + 1) + '</b><input class="in" data-i="' + i + '" aria-label="' + esc(x.label + ' ' + (i + 1)) + '" placeholder="' + esc(p) + '"></div>'; }).join('');
    else {
      var ac = x.key === 'client_name' ? 'name' : x.key === 'brand_name' ? 'organization' : { email: 'email', tel: 'tel', url: 'url' }[x.type] || 'off';
      body = '<input class="in" id="' + id + '" type="' + esc(x.type) + '"' + (x.type === 'number' ? ' inputmode="decimal"' : '') + ' autocomplete="' + ac + '" placeholder="' + esc(x.placeholder) + '">';
    }
    return '<div class="f' + (full ? ' full' : '') + '" data-q="' + esc(x.id) + '">' + lb + body + (x.hint ? '<small class="ht">' + esc(x.hint) + '</small>' : '') + '<small class="em">الحقل ده مطلوب</small></div>';
  }
  function node(x) { return $('[data-q="' + x.id + '"]'); }
  var empty = function (v) { return Array.isArray(v) ? !v.length : !v; };
  function val(x) {
    var f = node(x);
    if (x.type === 'radio') { var r = $('input:checked', f); return r ? r.value : ''; }
    if (x.type === 'checkbox') return $$('input:checked', f).map(function (i) { return i.value; });
    if (x.type === 'multitext') return $$('input', f).map(function (i) { return i.value.trim(); }).filter(Boolean);
    return $('.in', f).value.trim();
  }
  function setv(x, v) {
    var f = node(x); if (!f || v == null) return;
    if (x.type === 'radio' || x.type === 'checkbox') { var a = [].concat(v); $$('input', f).forEach(function (i) { i.checked = a.indexOf(i.value) > -1; }); }
    else if (x.type === 'multitext') $$('input', f).forEach(function (i, k) { i.value = v[k] || ''; });
    else $('.in', f).value = v;
  }
  function progress() {
    var n = INPUTS.filter(function (x) { return !empty(val(x)); }).length, p = INPUTS.length ? Math.round(n * 100 / INPUTS.length) : 0;
    $('#bar').style.width = p + '%'; $('#pct').textContent = p + '%';
  }
  var t;
  function changed() { progress(); clearTimeout(t); t = setTimeout(function () { var d = {}; INPUTS.forEach(function (x) { var v = val(x); if (!empty(v)) d[x.id] = v; }); try { localStorage.setItem(DRAFT, JSON.stringify(d)); } catch (e) {} }, 300); }
  function showErr(m) { var e = $('#er'); e.textContent = m; e.hidden = !m; }
  async function submit(ev) {
    ev.preventDefault(); showErr('');
    if ($('[name=website]').value) return finish();
    var bad = null;
    INPUTS.forEach(function (x) { var f = node(x), miss = x.required && empty(val(x)); f.classList.toggle('err', !!miss); if (miss && !bad) bad = f; });
    if (bad) { showErr('فيه حقول مطلوبة لسه فاضية. كمّلها وابعت تاني.'); bad.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (!ready) { showErr('الموقع لسه مش متوصّل بقاعدة البيانات. كلّم عبدالعزيز.'); return; }
    var answers = [], by = {};
    secs.forEach(function (s) { s.questions.forEach(function (x) { if (x.type === 'info') return; var v = val(x); if (x.key) by[x.key] = v; if (!empty(v)) answers.push({ s: s.title, q: x.label, v: v }); }); });
    var btn = $('#send'); btn.disabled = true; btn.textContent = 'بيتبعت...';
    try {
      var r = await req('brief_submissions', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ client_name: by.client_name || '', brand_name: by.brand_name || '', answers: answers }) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      finish();
    } catch (e) { btn.disabled = false; btn.textContent = 'إرسال البريف'; showErr('حصلت مشكلة في الإرسال. جرّب تاني بعد شوية.'); }
  }
  function finish() {
    try { localStorage.removeItem(DRAFT); } catch (e) {}
    $('#send').hidden = true; $('#fin p').hidden = true; $('#ok').hidden = false; $('#bar').style.width = '100%'; $('#pct').textContent = '100%';
    $('#fin').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  async function init() {
    if (ready) req('site_content?key=eq.settings&select=value').then(json).then(function (r) { var n = r[0] && r[0].value && r[0].value.site_name; if (n) { $('#sn').textContent = n; $('#fn').textContent = n; } }).catch(function () {});
    secs = await loadSections();
    INPUTS = [];
    secs.forEach(function (s) { (s.questions || []).forEach(function (x) { if (x.type !== 'info') INPUTS.push(x); }); });
    if (!secs.length) { $('#secs').innerHTML = '<section class="cd"><p>البريف مش متاح دلوقتي. جرّب تاني بعد شوية.</p></section>'; $('#fin').hidden = true; return; }
    $('#qn').innerHTML = secs.map(function (s, i) { return '<a href="#s' + (i + 1) + '"><b>' + (i + 1) + '</b>' + esc(String(s.title).split('(')[0].trim()) + '</a>'; }).join('');
    $('#secs').innerHTML = secs.map(function (s, i) {
      return '<section class="cd" id="s' + (i + 1) + '"><div class="sh"><b class="nb">' + (i + 1) + '</b><div><h2>' + esc(s.title) + '</h2><p>' + esc(s.description) + '</p></div></div><div class="fl">' + (s.questions || []).map(field).join('') + '</div></section>';
    }).join('');
    try { var d = JSON.parse(localStorage.getItem(DRAFT) || '{}'); INPUTS.forEach(function (x) { setv(x, d[x.id]); }); } catch (e) {}
    $('#bf').addEventListener('input', changed); $('#bf').addEventListener('change', changed); $('#bf').addEventListener('submit', submit);
    progress();
  }
  init();
})();
