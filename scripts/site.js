// USTO — scroll motion (Lenis + GSAP ScrollTrigger)
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = !!(window.gsap && window.ScrollTrigger);

  var nav = document.getElementById('nav');
  var prog = document.getElementById('progress');
  function ui(y) {
    if (nav) nav.classList.toggle('solid', y > 40);
    if (prog) { var h = doc.scrollHeight - innerHeight; prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%'; }
  }

  if ('serviceWorker' in navigator) {
    addEventListener('load', function () { navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {}); });
  }

  // Showcase ekran değişimi (motion olmasa da çalışır)
  var screens = [].slice.call(document.querySelectorAll('.sc'));
  var stepsEl = [].slice.call(document.querySelectorAll('.show-step'));
  function setStep(i) {
    screens.forEach(function (s, n) { s.classList.toggle('on', n === i); });
    stepsEl.forEach(function (s, n) { s.classList.toggle('on', n === i); });
  }
  setStep(0);

  if (!hasG || reduce) {
    addEventListener('scroll', function () { ui(scrollY); }, { passive: true });
    ui(scrollY);
    stepsEl.forEach(function (s) { s.classList.add('on'); });
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
        if (id.length > 1) { var el = document.querySelector(id); if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -60 }); } }
      });
    });
  } else { addEventListener('scroll', function () { ui(scrollY); }, { passive: true }); }
  ui(scrollY);

  // Hero girişi
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.pill', { y: 16, opacity: 0, duration: .7 }, .05)
    .from('.hero-h1 .l > span', { yPercent: 108, duration: 1.15, stagger: .1 }, '<.05')
    .from('.hero-lead', { y: 20, opacity: 0, duration: .8 }, '-=.65')
    .from('.hero-cta', { y: 20, opacity: 0, duration: .8 }, '-=.65')
    .from('.social', { y: 20, opacity: 0, duration: .8 }, '-=.68')
    .from('.phone', { y: 40, opacity: 0, scale: .96, duration: 1.2 }, .25)
    .from('.float', { y: 20, opacity: 0, scale: .92, duration: .8, stagger: .12 }, '-=.7');

  // Reveal
  ST.batch('[data-r]', {
    start: 'top 88%',
    onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: .85, ease: 'power3.out', stagger: .09, overwrite: true }); },
  });
  // NOT: refreshInit'te [data-r] sıfırlanmaz — refresh sonrası zaten görünenleri
  // tekrar gizler ve batch yeniden tetiklenmediği için kalıcı boş bölüm oluşur.

  // Floating kartlar — scroll parallax
  gsap.utils.toArray('.float').forEach(function (el) {
    var f = parseFloat(el.getAttribute('data-f')) || .4;
    gsap.to(el, { y: f * 90, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  // Hero telefon — hafif derinlik
  gsap.to('#heroPhone', { yPercent: -6, rotateX: 4, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Mouse parallax (ince)
  var stage = document.querySelector('.hero-stage');
  if (stage && matchMedia('(pointer:fine)').matches) {
    stage.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
      gsap.to('#heroPhone', { x: dx * 14, y: dy * 10, duration: .8, ease: 'power2.out' });
      gsap.to('.float', { x: function (i) { return dx * (18 + i * 6); }, y: function (i) { return dy * (12 + i * 4); }, duration: 1, ease: 'power2.out' });
    });
    stage.addEventListener('mouseleave', function () {
      gsap.to('#heroPhone,.float', { x: 0, y: 0, duration: 1, ease: 'power2.out' });
    });
  }

  // Pinned showcase — adım senkronu
  stepsEl.forEach(function (el, i) {
    ST.create({
      trigger: el, start: 'top 62%', end: 'bottom 42%',
      onEnter: function () { setStep(i); },
      onEnterBack: function () { setStep(i); },
    });
  });

  // Sayaçlar
  gsap.utils.toArray('.stat b[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var suf = el.getAttribute('data-suffix') || '';
    var o = { v: 0 };
    ST.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: function () {
        gsap.to(o, { v: target, duration: 1.8, ease: 'power2.out',
          onUpdate: function () {
            var n = dec ? o.v.toFixed(dec) : Math.round(o.v).toLocaleString('tr-TR');
            el.textContent = n + suf;
          } });
      },
    });
  });

  addEventListener('load', function () { ST.refresh(); });
})();
