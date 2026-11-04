/* ===================== ANIMATIONS (AOS) =====================
   الملف ده مسؤول عن كل حركات الظهور في موقع العميل (الصفحة الرئيسية + صفحة البريف).
   - بيراقب #appRoot، وأي عنصر جديد يظهر (حتى لو اتحمّل من قاعدة البيانات بعد فتح الصفحة) بياخد حركة تلقائي.
   - لتغيير حركة عنصر: عدّل في ANIM_RULES تحت (selector + نوع الحركة + التأخير).
   - على الموبايل: القوائم بتظهر عنصر عنصر من غير تأخير متراكم، والحركة أسرع شوية عشان الصفحة تفضل خفيفة.
   - لو الجهاز عامل "تقليل الحركة" في الإعدادات، الملف بيقف نفسه ومفيش حركات.
   - لو مكتبة AOS ماتحمّلتش لأي سبب، الموقع بيشتغل عادي من غير حركات.
============================================================ */
(function () {
  if (!window.AOS) return;
  var mq = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  if (mq('(prefers-reduced-motion: reduce)')) return;

  // [selector, نوع الحركة, تأخير ثابت بالملي ثانية, تأخير إضافي لكل عنصر في نفس المجموعة, يفضل التتابع على الموبايل؟]
  var ANIM_RULES = [
    // أول الصفحة
    ['#about .k',              'fade-up', 100, 0],
    ['#about .lead',           'fade-up', 200, 0],
    ['#about h1',              'fade-up', 300, 0],
    ['#about .cta',            'fade-up', 400, 0],
    ['#about .sts > div',      'fade-up', 450, 100, true],
    ['#about .pt',             'zoom-in', 150, 0],

    // عناوين الأقسام
    ['.sec > .w > .k',         'fade-up', 0,   0],
    ['.sec > .w > h2',         'fade-up', 100, 0],
    ['.sec > .w > .sub',       'fade-up', 150, 0],

    // نتايج الحملات
    ['#rtabs',                 'fade-up', 150, 0],
    ['#rgrid .cd',             'fade-up', 150, 150],

    // ليه تشتغل معايا
    ['#reasons .li',           'fade-up', 100, 150],
    ['#delivs details',        'fade-up', 100, 150],

    // البريف
    ['#brief .bf',             'zoom-in', 0,   0],
    ['#steps .li',             'fade-up', 200, 150],

    // الآراء
    ['#logos .cl',             'zoom-in', 100, 50],
    ['#rvgrid .fg',            'fade-up', 100, 150],

    // الشريطين المتحركين
    ['.mq',                    'fade-up', 100, 150],

    // التواصل
    ['#contacts .ct',          'fade-up', 100, 100],

    // صفحة البريف
    ['#secs > .cd',            'fade-up', 0,   0],
    ['#fin',                   'zoom-in', 0,   0]
  ];

  var phone = mq('(max-width: 760px)');
  AOS.init({
    duration: phone ? 600 : 700,
    easing: 'ease-out-cubic',
    once: true,          // الحركة بتحصل مرة واحدة بس، مش كل ما تعمل سكرول
    offset: phone ? 30 : 40,
    disable: false
  });

  // AOS بيقبل التأخير بخطوات 50 مللي ثانية بس (وأقصاه 3000)
  function ms(n) { return Math.min(3000, Math.max(0, Math.round(n / 50) * 50)); }

  function tagNewElements() {
    var root = document.getElementById('appRoot');
    if (!root) return;
    var tagged = false;
    ANIM_RULES.forEach(function (r) {
      var els = root.querySelectorAll(r[0] + ':not([data-aos])');
      for (var i = 0; i < els.length; i++) {
        var step = r[3], delay = r[2];
        if (phone && step && !r[4]) { step = 0; delay = 0; }      // موبايل: القوائم عمودية، كل عنصر يظهر لما توصله
        els[i].setAttribute('data-aos', r[1]);
        els[i].setAttribute('data-aos-delay', String(ms(delay + Math.min(i, 5) * step)));
        tagged = true;
      }
    });
    if (tagged) AOS.refreshHard();
  }

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () { scheduled = false; tagNewElements(); });
  }

  var root = document.getElementById('appRoot');
  if (root) {
    new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
    schedule();
  }
  // لو الصور غيّرت أطوال الصفحة بعد التحميل، نعيد حساب مواضع الحركات
  window.addEventListener('load', function () { setTimeout(function () { AOS.refresh(); }, 300); });
})();
