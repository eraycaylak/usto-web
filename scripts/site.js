// USTO — landing motion: Lenis smooth scroll + GSAP ScrollTrigger
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);

  /* ---------- Tema ---------- */
  var themeBtn = document.getElementById('theme-btn');
  function curTheme() {
    return doc.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function icon() { if (themeBtn) themeBtn.textContent = curTheme() === 'dark' ? '☀️' : '🌙'; }
  icon();
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = curTheme() === 'dark' ? 'light' : 'dark';
    doc.setAttribute('data-theme', next);
    try { localStorage.setItem('usto-theme', next); } catch (e) {}
    icon();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  });

  /* ---------- Header solid + progress ---------- */
  var header = document.getElementById('header');
  var progress = document.getElementById('progress');
  function onScrollUi(y) {
    if (header) header.classList.toggle('solid', y > window.innerHeight * 0.72);
    if (progress) {
      var h = doc.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }

  /* ---------- Service worker ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {});
    });
  }

  /* ---------- Motion yoksa: her şey görünür ---------- */
  if (!hasGSAP || reduce) {
    window.addEventListener('scroll', function () { onScrollUi(window.scrollY); }, { passive: true });
    onScrollUi(window.scrollY);
    // reveal'ları görünür bırak (CSS fallback zaten yapıyor)
    return;
  }

  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  doc.classList.add('gsap-ready'); // .reveal artık gizli başlar, JS gösterecek

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', function (e) { ScrollTrigger.update(); onScrollUi(e.animatedScroll || window.scrollY); });
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    // Nav içi anchor'lar için Lenis scrollTo
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length > 1) { var el = document.querySelector(id); if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -60 }); } }
      });
    });
  } else {
    window.addEventListener('scroll', function () { onScrollUi(window.scrollY); }, { passive: true });
  }
  onScrollUi(window.scrollY);

  /* ---------- Hero giriş animasyonu ---------- */
  var heroTl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  heroTl
    .from('.hero .eyebrow', { y: 20, opacity: 0, duration: .8 }, .1)
    .from('.hero-title .line > span', { yPercent: 110, duration: 1.1, stagger: .12 }, '<.05')
    .from('.hero-lead', { y: 24, opacity: 0, duration: .9 }, '-=.6')
    .from('.hero-actions', { y: 24, opacity: 0, duration: .9 }, '-=.7');

  /* ---------- Reveal (batch) ---------- */
  ScrollTrigger.batch('.reveal', {
    start: 'top 86%',
    onEnter: function (els) {
      gsap.to(els, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .1, overwrite: true });
    },
  });
  // Görünür alandaki reveal'lar için garanti
  ScrollTrigger.addEventListener('refreshInit', function () {
    gsap.set('.reveal', { opacity: 0, y: 30 });
  });

  /* ---------- Parallax (data-parallax) ---------- */
  gsap.utils.toArray('[data-parallax]').forEach(function (el) {
    var amt = parseFloat(el.getAttribute('data-parallax')) || 0.15;
    gsap.fromTo(el, { yPercent: -amt * 50 }, {
      yPercent: amt * 50, ease: 'none',
      scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  /* ---------- İstatistik sayaçları ---------- */
  gsap.utils.toArray('.stat b[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var pre = (el.getAttribute('data-prefix') || '').replace('&lt;', '<');
    var suf = el.getAttribute('data-suffix') || '';
    var obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: target, duration: 1.6, ease: 'power2.out',
          onUpdate: function () { el.textContent = pre + obj.v.toFixed(dec) + suf; },
        });
      },
    });
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
