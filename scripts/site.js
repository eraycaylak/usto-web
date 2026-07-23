// USTO — scroll motion (Lenis + GSAP ScrollTrigger)
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = !!(window.gsap && window.ScrollTrigger);

  var nav = document.getElementById('nav');
  var prog = document.getElementById('progress');
  function ui(y) {
    if (nav) nav.classList.toggle('solid', y > 30);
    if (prog) { var h = doc.scrollHeight - innerHeight; prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%'; }
  }

  if ('serviceWorker' in navigator) {
    addEventListener('load', function () { navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {}); });
  }

  // Reveal sistemi — saf CSS sınıfı (rAF'a bağımlı değil)
  function setupReveal() {
    doc.classList.add('js-r');                 // ancak JS varsa gizle
    var hero = [], rest = [];
    document.querySelectorAll('[data-r]').forEach(function (el) {
      (el.hasAttribute('data-hero') ? hero : rest).push(el);
    });
    // Hero: hemen, sıralı gecikmeyle
    hero.forEach(function (el) {
      var d = parseInt(el.getAttribute('data-hero'), 10) || 1;
      el.style.transitionDelay = (d * 0.09) + 's';
      requestAnimationFrame(function () { el.classList.add('in'); });
      setTimeout(function () { el.classList.add('in'); }, 60 + d * 90);   // rAF durursa emniyet
    });
    // Diğerleri: görünür olunca
    if (!('IntersectionObserver' in window)) {
      rest.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = (n++ * 0.08) + 's';
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    rest.forEach(function (el) { io.observe(el); });
    // Emniyet ağı: 4 sn sonra hâlâ gizli kalan kalmasın
    setTimeout(function () {
      document.querySelectorAll('[data-r]:not(.in)').forEach(function (el) { el.classList.add('in'); });
    }, 4000);
  }

  // Sayaç (prefix/suffix/ondalık destekli) — motion olsun olmasın çalışsın
  function runCounter(el, animate) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    function render(v) {
      var n = dec ? v.toFixed(dec).replace('.', ',') : Math.round(v).toLocaleString('tr-TR');
      el.textContent = pre + n + suf;
    }
    if (!animate) { render(target); return; }
    var o = { v: 0 };
    window.gsap.to(o, { v: target, duration: 1.8, ease: 'power2.out', onUpdate: function () { render(o.v); } });
  }

  if (!hasG || reduce) {
    addEventListener('scroll', function () { ui(scrollY); }, { passive: true });
    ui(scrollY);
    setupReveal();
    document.querySelectorAll('[data-count]').forEach(function (el) { runCounter(el, false); });
    return;
  }

  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  doc.classList.add('gsap-on');

  // Lenis
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on('scroll', function (e) { ST.update(); ui(e.animatedScroll || scrollY); });
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length > 1) { var el = document.querySelector(id); if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -70 }); } }
      });
    });
  } else { addEventListener('scroll', function () { ui(scrollY); }, { passive: true }); }
  ui(scrollY);

  // NOT: Hero girişi artık CSS reveal ile (setupReveal). GSAP .from kullanılmıyor —
  // rAF durduğunda elemanlar opacity 0'da kilitli kalıyordu.

  // Reveal — CSS sınıfı + IntersectionObserver.
  // GSAP tween KULLANMIYORUZ: rAF durursa (gizli sekme) içerik gizli kalırdı.
  setupReveal();

  // Floating kartlar — scroll parallax
  gsap.utils.toArray('.fcard').forEach(function (el, i) {
    var f = [0.55, -0.4, 0.7][i % 3];
    gsap.to(el, { y: f * 80, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  // Telefon derinliği
  gsap.to('#heroPhone', { yPercent: -5, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Mouse parallax
  var stage = document.querySelector('.hero-stage');
  if (stage && matchMedia('(pointer:fine)').matches) {
    stage.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
      gsap.to('#heroPhone', { x: dx * 12, y: dy * 9, duration: .8, ease: 'power2.out' });
      gsap.to('.fcard', { x: function (i) { return dx * (16 + i * 7); }, y: function (i) { return dy * (11 + i * 4); }, duration: 1, ease: 'power2.out' });
    });
    stage.addEventListener('mouseleave', function () {
      gsap.to('#heroPhone,.fcard', { x: 0, y: 0, duration: 1, ease: 'power2.out' });
    });
  }

  // Sayaçlar
  gsap.utils.toArray('[data-count]').forEach(function (el) {
    ST.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () { runCounter(el, true); } });
  });
  // Emniyet: animasyon karesi durursa sayaçlar "0" kalmasın
  setTimeout(function () {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      if (el.textContent.trim() === '0') runCounter(el, false);
    });
  }, 4000);

  addEventListener('load', function () { ST.refresh(); });
})();
